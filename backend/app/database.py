from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.services import portfolio_manager


class Base(DeclarativeBase):
    pass


def get_engine(portfolio_name: str):
    db_path = portfolio_manager.get_db_path(portfolio_name)
    return create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )


def init_db(portfolio_name: str):
    engine = get_engine(portfolio_name)
    Base.metadata.create_all(bind=engine)
    return engine


def get_db():
    active = portfolio_manager.get_active()
    engine = get_engine(active)
    session = sessionmaker(autocommit=False, autoflush=False, bind=engine)()
    try:
        yield session
    finally:
        session.close()
