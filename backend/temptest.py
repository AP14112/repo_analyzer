from app.core.database import SessionLocal
from app.modules.reasoning.service import ReasoningService


db = SessionLocal()

try:
    service = ReasoningService(db)

    result = service.answer(
        query="How does retry handling work?",
        repository_id=11,  # use your actual repository ID
        limit=5,
    )

    print("\n================ ANSWER ================\n")
    print(result["answer"])

    print("\n================ SOURCES ================\n")

    for source in result["sources"]:
        print(
            f"{source.get('file_path', 'unknown')} "
            f"({source.get('start_line', '?')}-"
            f"{source.get('end_line', '?')})"
        )

finally:
    db.close()