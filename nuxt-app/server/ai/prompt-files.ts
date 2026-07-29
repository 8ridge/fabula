import type { AiModuleId } from './catalog'

export const PROMPT_SOURCE_FILES: Record<AiModuleId, string> = {
  'authoritative-turn': '01_deepseek_authoritative_turn.md',
  'scene-plan': '02_nemotron_scene_and_arc_planner.md',
  'scene-plan-paid': '02_nemotron_scene_and_arc_planner.md',
  narration: '03_aion_narrative_scene.md',
  'turn-qa': '04_mistral_story_fallback_and_audit.md',
  'scene-image': '05_krea_cheap_scene_image.md',
  'hero-image': '06_krea_premium_hero_image.md',
  'pack-image': '13_krea_pack_visual_bible.md',
  'image-repair': '14_riverflow_image_repair.md',
  'item-image': '15_recraft_item_art.md',
  'exclusive-video': '07_grok_exclusive_video.md',
  'exclusive-video-premium': '07_grok_exclusive_video.md',
  inventory: '08_deepseek_items_and_inventory.md',
  journal: '09_deepseek_journal_and_memory.md',
  'world-compiler': '10_deepseek_world_story_compiler.md',
  'action-tracker': '11_deepseek_action_and_microstate_tracker.md',
  difficulty: '12_nemotron_dynamic_difficulty.md',
}
