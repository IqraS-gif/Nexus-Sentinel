from enum import Enum

class SeverityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class StatusEnum(str, Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"

class DemoStageEnum(str, Enum):
    ACT_1 = "act1"
    ACT_2 = "act2"
    ACT_3 = "act3"
    ACT_4 = "act4"
