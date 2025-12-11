import matplotlib.pyplot as plt
import io
import json
from datetime import datetime

def generate_simple_report(participant_id, task_logs, stress_logs):
    # task_logs: list of dicts with timestamp & correct fields
    # stress_logs: list of dicts with timestamp & ema_high
    fig, axes = plt.subplots(2, 1, figsize=(8, 6), tight_layout=True)

    # Task accuracy over time
    if task_logs:
        times = [t['timestamp'] for t in task_logs]
        acc = []
        # compute rolling accuracy by trial (0/1) - simplistic
        values = [1 if t.get("correct") else 0 for t in task_logs]
        acc = values
        axes[0].plot(times, acc, marker='o', linestyle='-')
        axes[0].set_title("Trial Correct (1) / Incorrect (0)")
        axes[0].set_ylabel("Correct")

    # Stress EMA over time
    if stress_logs:
        stimes = [s['timestamp'] for s in stress_logs]
        ema = [s.get('ema_high', 0) for s in stress_logs]
        axes[1].plot(stimes, ema, marker='.', linestyle='-')
        axes[1].set_title("EMA High-Probability over time")
        axes[1].set_ylabel("EMA High")

    bio = io.BytesIO()
    fig.autofmt_xdate()
    plt.savefig(bio, format='pdf')
    bio.seek(0)
    return bio
