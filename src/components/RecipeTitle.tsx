import { CupSoda, Soup, IceCreamBowl } from 'lucide-react';

const titleIcons = [
  { emoji: '🥤', Icon: CupSoda },
  { emoji: '🥣', Icon: Soup },
  { emoji: '🍨', Icon: IceCreamBowl },
];

/** Render the owner's title with an SVG in place of its decorative emoji. */
export default function RecipeTitle({ title }: { title: string }) {
  const match = titleIcons.find(({ emoji }) => title.includes(emoji));
  if (!match) return <>{title}</>;
  const [before, after] = title.split(match.emoji);
  const Icon = match.Icon;
  return <>{before}<Icon className="nita-recipe-title-icon" aria-hidden="true" focusable="false" />{after}</>;
}
