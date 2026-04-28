from sqlalchemy import Column, Integer, String
from app.database import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String)
    username = Column(String)
    likes = Column(Integer, default=0)
    retweets = Column(Integer, default=0)
    platform = Column(String)