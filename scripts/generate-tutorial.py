"""Compatibility entry point: regenerate the synchronized guide and booklet."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name("generate-help.py")),run_name="__main__")
