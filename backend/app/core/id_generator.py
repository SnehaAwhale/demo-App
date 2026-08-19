from datetime import datetime

from app.extensions import db
from app.models.id_sequence import IdSequence
from app.models.session import Session

PREFIX = "ARCF"
PRODUCT_CODE = "0"  # placeholder single-digit product code until product selection exists
NAME_INITIAL = "S"  # placeholder initial; revisit once naming logic is defined

SEQUENCE_ID = 1
SEQUENCE_START = 999


def _next_sequence_value() -> int:
    """
    Returns the next value of the shared 3-digit counter, counting down
    from 999 and wrapping back to 999 once it reaches 0.
    """
    seq = db.session.get(IdSequence, SEQUENCE_ID)
    if seq is None:
        seq = IdSequence(id=SEQUENCE_ID, current_value=SEQUENCE_START)
        db.session.add(seq)
        db.session.flush()

    value = seq.current_value
    seq.current_value = SEQUENCE_START if value <= 0 else value - 1
    db.session.flush()
    return value


def generate_application_id() -> str:
    """
    Generates a unique Application ID in the format:
    <PREFIX><YY><DD><ProductCode><NameInitial><counter>
    e.g. ARCF26230S398
    """
    now = datetime.now()
    year = now.strftime("%y")
    day = now.strftime("%d")
    sequence = f"{_next_sequence_value():03d}"

    return f"{PREFIX}{year}{day}{PRODUCT_CODE}{NAME_INITIAL}{sequence}"


def generate_unique_application_id() -> str:
    """
    Generates an Application ID, retrying on the rare case where the
    3-digit counter has wrapped around and collided with an ID already
    issued earlier the same day (same year+day+product+initial).
    """
    for _ in range(SEQUENCE_START + 1):
        candidate = generate_application_id()
        if db.session.get(Session, candidate) is None:
            return candidate

    raise RuntimeError("Unable to generate a unique Application ID: sequence exhausted for today")
