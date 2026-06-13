from app.db.session import engine
from sqlalchemy import inspect

print("DB:", engine.url)

inspector = inspect(engine)

print("Tables:")
print(inspector.get_table_names())