# backend/database/models.py

from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Float, JSON, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.mutable import MutableList
from datetime import datetime

from .base import Base

# -------------------------
# Admin User
# -------------------------
class AdminUser(Base):
    __tablename__ = "admin_users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(128), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# -------------------------
# Participant
# -------------------------
class Participant(Base):
    __tablename__ = "participants"
    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(String(64), unique=True, index=True, nullable=False)
    assignment_group = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("Session", back_populates="participant")


# -------------------------
# Session
# -------------------------
class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(String(64), ForeignKey("participants.participant_id"))
    token = Column(String(256), unique=True, nullable=False, index=True)

    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ema_high = Column(Float, default=0.0)

    participant = relationship("Participant", back_populates="sessions")


# -------------------------
# TaskLog
# -------------------------
class TaskLog(Base):
    __tablename__ = "task_logs"
    id = Column(Integer, primary_key=True, index=True)

    participant_id = Column(String(64), index=True)
    session_token = Column(String(256), index=True)

    task_name = Column(String(128), index=True)
    trial_index = Column(Integer, nullable=True)
    event = Column(String(128), nullable=True)

    correct = Column(Boolean, nullable=True)
    reaction_time_ms = Column(Float, nullable=True)
    extra = Column(JSON, nullable=True)

    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


# -------------------------
# StressLog
# -------------------------
class StressLog(Base):
    __tablename__ = "stress_logs"
    id = Column(Integer, primary_key=True, index=True)

    participant_id = Column(String(64), index=True)
    session_token = Column(String(256), index=True)

    raw_proba = Column(JSON, nullable=True)
    ema_high = Column(Float, nullable=True)
    smoothed_label = Column(Integer, nullable=True)
    difficulty = Column(Integer, nullable=True)
    features = Column(JSON, nullable=True)

    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


# -------------------------
# TaskSession
# -------------------------
class TaskSession(Base):
    __tablename__ = "task_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)

    participant_id = Column(String, ForeignKey("participants.participant_id"), nullable=False)
    task_name = Column(String, nullable=False)

    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)

    difficulty_history = Column(MutableList.as_mutable(JSON), default=list)
    stress_history = Column(MutableList.as_mutable(JSON), default=list)

    config = Column(JSON, default=dict)

    participant = relationship("Participant", backref="task_sessions")


# -------------------------
# TaskTrial
# -------------------------
class TaskTrial(Base):
    __tablename__ = "task_trials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("task_sessions.id"), nullable=False)
    trial_index = Column(Integer, nullable=False)

    stimulus = Column(JSON, default=dict)
    response = Column(String, nullable=True)
    correct = Column(Boolean, nullable=True)
    reaction_time_ms = Column(Integer, nullable=True)

    difficulty_level = Column(Integer, nullable=True)
    stress_level = Column(Float, nullable=True)

    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("TaskSession", backref="trials")
