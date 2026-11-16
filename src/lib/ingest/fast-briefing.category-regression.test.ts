import assert from "node:assert/strict";
import test from "node:test";
import { inferStoryCategory } from "./fast-briefing";
import { EVALUATION_FEEDS } from "../discovery-feeds";
import type { StoryCategory } from "@/types/story";

// Includes observed evaluation headlines and adversarial topic collisions.
const cases: ReadonlyArray<readonly [string, StoryCategory, StoryCategory]> = [
  [
    "Solar system planet discovery",
    "World",
    "Technology"
  ],
  [
    "Solar eclipse visible tomorrow",
    "World",
    "Technology"
  ],
  [
    "Solar storm may disrupt satellites",
    "World",
    "Technology"
  ],
  [
    "Solar panels expand electricity output",
    "World",
    "Energy"
  ],
  [
    "Solar energy prices fall",
    "World",
    "Energy"
  ],
  [
    "Nuclear power plant expansion",
    "World",
    "Energy"
  ],
  [
    "NASA telescope images solar corona",
    "World",
    "Technology"
  ],
  [
    "Wind power grid upgrade",
    "World",
    "Energy"
  ],
  [
    "Oil pipeline shut down",
    "World",
    "Energy"
  ],
  [
    "Solar flare threatens power grid",
    "World",
    "Technology"
  ],
  [
    "Planet-saving solar energy investments",
    "World",
    "Energy"
  ],
  [
    "Solar panel plant expands power production",
    "World",
    "Energy"
  ],
  [
    "Astronomers discover exoplanet",
    "World",
    "Technology"
  ],
  [
    "Astronomy mission measures solar wind",
    "World",
    "Technology"
  ],
  [
    "Solar-powered telescope launch",
    "World",
    "Technology"
  ],
  [
    "Solar battery storage prices fall",
    "World",
    "Energy"
  ],
  [
    "Nuclear fusion energy reactor announced",
    "World",
    "Energy"
  ],
  [
    "Wind power capacity doubles",
    "World",
    "Energy"
  ],
  [
    "Cosmic radiation telescope discovery",
    "World",
    "Technology"
  ],
  [
    "Solar eclipse tourism boosts local economy",
    "World",
    "Technology"
  ],
  [
    "NASA Webb telescope spots an early galaxy",
    "Energy",
    "Technology"
  ],
  [
    "Study A.I. Consciousness? The Bots Would Like a Word With You.",
    "Energy",
    "Technology"
  ],
  [
    "Cancer drug price falls after FDA approval",
    "Markets",
    "Health"
  ],
  [
    "Trump admin shelves Cyclospora research despite record-breaking outbreak",
    "Technology",
    "Health"
  ],
  [
    "Supreme Court agrees to hear privacy case",
    "World",
    "Courts"
  ],
  [
    "Defense lawyers withdraw from murder case",
    "World",
    "Courts"
  ],
  [
    "Football star retires after World Cup",
    "World",
    "Culture"
  ],
  [
    "Texas Tech head coach blasts USC over poor attendance at LA Coliseum",
    "Technology",
    "Culture"
  ],
  [
    "Astronomical energy bills force households to cut back",
    "World",
    "Energy"
  ],
  [
    "Wind power costs reach astronomical highs",
    "World",
    "Energy"
  ],
  [
    "Electricity bills soar to astronomical levels",
    "World",
    "Energy"
  ],
  [
    "Astronomical observations reveal a new solar system",
    "World",
    "Technology"
  ],
  [
    "Astronomers map a distant galaxy",
    "Energy",
    "Technology"
  ],
  [
    "A solar observatory measures solar radiation",
    "Energy",
    "Technology"
  ],
  [
    "Congress passes budget",
    "World",
    "Politics"
  ],
  [
    "Federal Reserve cuts interest rates",
    "World",
    "Markets"
  ],
  [
    "Software update improves internet security",
    "World",
    "Technology"
  ],
  [
    "International talks resume",
    "World",
    "World"
  ],
  [
    "Cancer vaccine clinical trial begins",
    "World",
    "Health"
  ],
  [
    "Supreme Court issues ruling",
    "World",
    "Courts"
  ],
  [
    "Nuclear power plant expands",
    "World",
    "Energy"
  ],
  [
    "Film festival announces winners",
    "World",
    "Culture"
  ],
  [
    "Solar-panel plant expands power production",
    "World",
    "Energy"
  ],
  [
    "Solar wind threatens power grids",
    "Energy",
    "Technology"
  ],
  [
    "Astronomer observes a new star",
    "Energy",
    "Technology"
  ],
  [
    "School astronomers study distant objects",
    "Energy",
    "Technology"
  ],
  [
    "Solar battery storage lowers energy costs",
    "World",
    "Energy"
  ],
  [
    "Utility reports astronomical oil and gas costs",
    "World",
    "Energy"
  ],
  [
    "NASA telescope schedules a solar eclipse observation",
    "Energy",
    "Technology"
  ],
  [
    "Texas Tech head coach discusses astronomical ticket prices",
    "Technology",
    "Culture"
  ],
  [
    "James Bond franchise announces a new actor",
    "Markets",
    "Culture"
  ],
  [
    "SpaceX successfully catches top of huge Starship rocket for first time",
    "World",
    "Technology"
  ],
  [
    "GTA 6 hacker pleads guilty after release from secure hospital",
    "Technology",
    "Courts"
  ],
  [
    "Man sentenced over 'horrific' attempted murder of three children",
    "World",
    "Courts"
  ],
  [
    "Patient pleads guilty after hospital data theft",
    "Health",
    "Courts"
  ],
  [
    "Satellite launch monitors solar storms",
    "Energy",
    "Technology"
  ]
];

for (const [title, fallback, expected] of cases) {
  test(`headline classification: ${title} [${fallback}]`, () => {
    assert.equal(inferStoryCategory(title, fallback), expected);
  });
}

test("broad BBC Science discovery does not default weather to Energy", () => {
  const feed = EVALUATION_FEEDS.find((item) => item.name === "BBC Science");
  assert.ok(feed);
  assert.equal(feed.category, "World");
  for (const [title, expected] of [
    ["Yellow weather warnings issued for snow as temperatures plummet", "World"],
    ["Gas starts flowing from Jackdaw after government green light", "Energy"],
    ["How to spot November's planetary parade in the pre-dawn sky", "Technology"],
    ["SpaceX successfully catches top of huge Starship rocket for first time", "Technology"],
  ] as const) assert.equal(inferStoryCategory(title, feed.category), expected, title);
});
