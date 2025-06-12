import os,json
import pandas as pd

def log_to_file(data, log_file_path):
    print(data)
    # Check if the log file exists; if not, create it with an empty list
    if not os.path.exists(log_file_path):
        with open(log_file_path, 'w', encoding="utf-8") as f:
            json.dump([], f, indent=4)

    try:
        with open(log_file_path, 'r', encoding="utf-8") as f:
            logs = json.load(f)
    except (json.JSONDecodeError, ValueError):  # Catch empty or invalid JSON
        logs = []  # Initialize with an empty list if the file is empty or invalid


    # Append new data to the logs
    logs.append(data)

    # Write the updated logs back to the file
    with open(log_file_path, 'w', encoding="utf-8") as f:
        json.dump(logs, f, indent=4,ensure_ascii=False)

    # Print the updated logs for debugging
    print(logs)
    print(f"successfully logged to {log_file_path}")


