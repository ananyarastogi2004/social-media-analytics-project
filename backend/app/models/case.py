from sqlalchemy import Column, Integer, String
from app.database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    keyword = Column(String)
    platform = Column(String)

    # 🔥 NEW FIELD
    dataset_id = Column(String)