from cave_prompt import resources

def test_system_prompt_loads_nonempty():
    text = resources.system_prompt()
    assert "Cave Prompt" in text and len(text) > 500

def test_schemas_load():
    sa = resources.schema("semantic-analysis")
    ir = resources.schema("optimized-ir")
    assert sa["title"].startswith("Cave Prompt")
    assert "task_type" in ir["properties"]
