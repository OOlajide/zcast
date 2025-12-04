import pandas as pd
import numpy as np
import json
import sys
import os

ZATOSHI_TO_ZEC = 1e8  # ✅ Conversion constant

def analyze_zcash_metrics(date):
    files = {
        'blocks': f'blockchair_zcash_blocks_{date}.tsv',
        'transactions': f'blockchair_zcash_transactions_{date}.tsv',
        'inputs': f'blockchair_zcash_inputs_{date}.tsv',
        'outputs': f'blockchair_zcash_outputs_{date}.tsv'
    }

    # Verify files exist before trying to read
    for key, file_path in files.items():
        if not os.path.exists(file_path):
            output = {"error": f"File not found: {file_path}"}
            print(json.dumps(output, indent=2))
            with open(f"metrics_{date}.json", "w") as f:
                json.dump(output, f, indent=2)
            return

    try:
        df_blocks = pd.read_csv(files['blocks'], sep='\t')
        df_transactions = pd.read_csv(files['transactions'], sep='\t')
        df_inputs = pd.read_csv(files['inputs'], sep='\t')
        df_outputs = pd.read_csv(files['outputs'], sep='\t')
    except Exception as e:
        output = {"error": f"Error reading files: {str(e)}"}
        print(json.dumps(output, indent=2))
        with open(f"metrics_{date}.json", "w") as f:
            json.dump(output, f, indent=2)
        return

    total_zec_shielded = (
        df_transactions[df_transactions['shielded_value_delta'] > 0]['shielded_value_delta'].sum()
        / ZATOSHI_TO_ZEC
    )

    total_zec_deshielded = (
        df_transactions[df_transactions['shielded_value_delta'] < 0]['shielded_value_delta'].sum()
        / ZATOSHI_TO_ZEC
    )

    net_privacy_flow = total_zec_shielded + total_zec_deshielded

    shielded_transactions_count = df_transactions[df_transactions['shielded_value_delta'] != 0].shape[0]
    total_transactions = df_transactions.shape[0]

    percentage_shielded_transactions = (
        (shielded_transactions_count / total_transactions) * 100
        if total_transactions > 0 else 0
    )

    transparent_transactions_count = df_transactions[df_transactions['shielded_value_delta'] == 0].shape[0]

    shielded_values = (
        df_transactions[df_transactions['shielded_value_delta'] != 0]['shielded_value_delta'].abs()
        / ZATOSHI_TO_ZEC
    )

    median_shielded_value = shielded_values.median() if not shielded_values.empty else 0
    mean_shielded_value = shielded_values.mean() if not shielded_values.empty else 0

    outputs_gt_10k_usd = df_outputs[df_outputs['value_usd'] > 10000]
    outputs_gt_100k_usd = df_outputs[df_outputs['value_usd'] > 100000]
    outputs_gt_1m_usd = df_outputs[df_outputs['value_usd'] > 1000000]

    largest_zec_movement = df_outputs.loc[df_outputs['value'].idxmax()].copy()
    largest_zec_movement['value'] /= ZATOSHI_TO_ZEC

    largest_usd_movement = df_outputs.loc[df_outputs['value_usd'].idxmax()]

    top_10_whale_transfers = df_outputs.sort_values(by='value_usd', ascending=False).head(10)

    Q1_fee = df_transactions['fee_usd'].quantile(0.25)
    Q3_fee = df_transactions['fee_usd'].quantile(0.75)
    IQR_fee = Q3_fee - Q1_fee
    anomaly_threshold_fee = Q3_fee + 1.5 * IQR_fee
    high_fee_anomalies = df_transactions[df_transactions['fee_usd'] > anomaly_threshold_fee]

    df_blocks['time'] = pd.to_datetime(df_blocks['time'])
    df_blocks_sorted = df_blocks.sort_values(by='time')

    block_intervals = df_blocks_sorted['time'].diff().dropna()
    min_block_interval = block_intervals.min()
    max_block_interval = block_intervals.max()

    total_blocks_mined = len(df_blocks)
    average_block_difficulty = df_blocks['difficulty'].mean()
    average_transactions_per_block = df_blocks['transaction_count'].mean()
    total_miner_fees = df_blocks['fee_total'].sum()
    average_block_size = df_blocks['size'].mean()

    miner_distribution = df_blocks['guessed_miner'].value_counts(normalize=True) * 100
    dominance_40_percent = miner_distribution[miner_distribution > 40]
    dominance_50_percent = miner_distribution[miner_distribution > 50]

    df_transactions['output_total'] = pd.to_numeric(df_transactions['output_total'], errors='coerce').fillna(0)

    total_zec_transferred = df_transactions['output_total'].sum() / ZATOSHI_TO_ZEC

    total_usd_transferred = df_transactions['output_total_usd'].sum()

    avg_fee_usd = df_transactions['fee_usd'].mean()
    median_fee_usd = df_transactions['fee_usd'].median()
    min_fee_usd = df_transactions['fee_usd'].min()
    max_fee_usd = df_transactions['fee_usd'].max()

    min_block_time = df_blocks['time'].min()
    max_block_time = df_blocks['time'].max()
    total_duration_seconds = (max_block_time - min_block_time).total_seconds()

    tps = total_transactions / total_duration_seconds if total_duration_seconds > 0 else 0

    unique_output_recipients = set(df_outputs['recipient'].unique())
    unique_input_recipients = set(df_inputs['recipient'].unique())
    num_unique_active_addresses = len(unique_output_recipients.union(unique_input_recipients))

    df_transactions['output_total_usd'] = pd.to_numeric(
        df_transactions['output_total_usd'], errors='coerce'
    ).fillna(0)

    def categorize_transaction_size(value):
        if value <= 100: return 'Small'
        elif 100 < value <= 1000: return 'Medium'
        elif 1000 < value <= 10000: return 'Large'
        else: return 'Whale'

    df_transactions['transaction_size_category'] = df_transactions['output_total_usd'].apply(
        categorize_transaction_size
    )

    transaction_size_counts = df_transactions['transaction_size_category'].value_counts()

    empty_blocks = df_blocks[df_blocks['transaction_count'] == 1]

    Q1_tx = df_blocks['transaction_count'].quantile(0.25)
    Q3_tx = df_blocks['transaction_count'].quantile(0.75)
    IQR_tx = Q3_tx - Q1_tx
    anomaly_threshold_tx_count = Q3_tx + 1.5 * IQR_tx
    high_tx_count_blocks = df_blocks[df_blocks['transaction_count'] > anomaly_threshold_tx_count]

    recipient_stats = df_outputs.groupby('recipient').agg(
        output_count=('index', 'count'),
        total_value_usd=('value_usd', 'sum')
    ).reset_index()

    Q1_out = recipient_stats['output_count'].quantile(0.25)
    Q3_out = recipient_stats['output_count'].quantile(0.75)
    IQR_out = Q3_out - Q1_out
    anomaly_threshold_output_count = Q3_out + 1.5 * IQR_out
    high_output_count_recipients = recipient_stats[
        recipient_stats['output_count'] > anomaly_threshold_output_count
    ]

    Q1_val = recipient_stats['total_value_usd'].quantile(0.25)
    Q3_val = recipient_stats['total_value_usd'].quantile(0.75)
    IQR_val = Q3_val - Q1_val
    anomaly_threshold_total_value_usd = Q3_val + 1.5 * IQR_val
    high_value_recipients = recipient_stats[
        recipient_stats['total_value_usd'] > anomaly_threshold_total_value_usd
    ]

    shielded_delta_values = (
        df_transactions[df_transactions['shielded_value_delta'] != 0]['shielded_value_delta'].abs()
        / ZATOSHI_TO_ZEC
    )

    shielded_spike_anomalies = pd.DataFrame()
    anomaly_threshold_shielded_delta = 0.0

    if not shielded_delta_values.empty:
        Q1_sd = shielded_delta_values.quantile(0.25)
        Q3_sd = shielded_delta_values.quantile(0.75)
        IQR_sd = Q3_sd - Q1_sd
        anomaly_threshold_shielded_delta = Q3_sd + 1.5 * IQR_sd

        shielded_spike_anomalies = df_transactions[
            (df_transactions['shielded_value_delta'].abs() / ZATOSHI_TO_ZEC >
             anomaly_threshold_shielded_delta)
        ]

    metrics_output = {
        "privacy_metrics": {
            "total_zec_shielded": float(total_zec_shielded),
            "total_zec_deshielded": float(total_zec_deshielded),
            "net_privacy_flow": float(net_privacy_flow),
            "shielded_transactions_count": int(shielded_transactions_count),
            "percentage_shielded_transactions": float(percentage_shielded_transactions),
            "median_absolute_shielded_value_delta": float(median_shielded_value),
            "mean_absolute_shielded_value_delta": float(mean_shielded_value),
            "transparent_transactions_count": int(transparent_transactions_count)
        },
        "network_throughput_metrics": {
            "total_zec_transferred": float(total_zec_transferred),
            "total_usd_transferred": float(total_usd_transferred),
            "average_transaction_fee_usd": float(avg_fee_usd),
            "median_transaction_fee_usd": float(median_fee_usd),
            "minimum_transaction_fee_usd": float(min_fee_usd),
            "maximum_transaction_fee_usd": float(max_fee_usd),
            "estimated_tps": float(tps),
            "num_unique_active_addresses": int(num_unique_active_addresses),
            "transaction_size_category_counts": transaction_size_counts.to_dict()
        }
    }

    with open(f"metrics_{date}.json", "w") as f:
        json.dump(metrics_output, f, indent=2)

    print(f"✅ Successfully created metrics_{date}.json")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analytics.py YYYYMMDD")
        sys.exit(1)

    analyze_zcash_metrics(sys.argv[1])