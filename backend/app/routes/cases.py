from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.case import Case

router = APIRouter()


@router.post("/create")
def create_case(
    name: str,
    keyword: str,
    platform: str,
    dataset_id: str,
    db: Session = Depends(get_db)
):
    case = Case(
        name=name,
        keyword=keyword,
        platform=platform,
        dataset_id=dataset_id
    )

    db.add(case)
    db.commit()

    return {"message": "Case created", "case_id": case.id}