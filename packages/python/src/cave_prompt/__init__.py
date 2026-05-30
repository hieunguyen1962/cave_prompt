"""Cave Prompt — semantic prompt compiler."""
from cave_prompt.compiler import compile, CompileResult, BlockingAmbiguity
from cave_prompt.config import Config, load_config

__version__ = "1.0.0"
__all__ = ["compile", "CompileResult", "BlockingAmbiguity", "Config", "load_config", "__version__"]
