# simple helper to broadcast monitor updates via socketio
def emit_monitor_update(socketio, pid, payload):
    try:
        room = "monitor_admin"
        socketio.emit("monitor_update", {"participant_id": pid, **payload}, room=room)
    except Exception:
        pass
