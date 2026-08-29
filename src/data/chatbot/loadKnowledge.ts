import company from "./company.json";
import contact from "./contact.json";
import locations from "./locations.json";
import limitations from "./limitations.json";
import services from "./services.json";
import terms from "./terms.json";
import synonyms from "./synonyms.json";
import intents from "./intents.json";
import ambiguous from "./ambiguous.json";
import contextRules from "./context-rules.json";
import conceptRules from "./concept-rules.json";
import signals from "./signals.json";
import knowledge from "./knowledge.json";
import entities from "./entities.json";
import agentRules from "./agent-rules.json";
import conceptGraph from "./concept-graph.json";

export type ChatbotLanguage = "ar" | "en";

export interface StaticKnowledgeBundle {
  company: typeof company;
  contact: typeof contact;
  locations: typeof locations;
  limitations: typeof limitations;
  services: typeof services;
  terms: typeof terms;
  synonyms: typeof synonyms;
  intents: typeof intents;
  ambiguous: typeof ambiguous;
  contextRules: typeof contextRules;
  conceptRules: typeof conceptRules;
  signals: typeof signals;
  knowledge: typeof knowledge;
  entities: typeof entities;
  agentRules: typeof agentRules;
  conceptGraph: typeof conceptGraph;
}

let cached: StaticKnowledgeBundle | null = null;

export function getStaticKnowledgeBundle(): StaticKnowledgeBundle {
  if (!cached) {
    cached = {
      company,
      contact,
      locations,
      limitations,
      services,
      terms,
      synonyms,
      intents,
      ambiguous,
      contextRules,
      conceptRules,
      signals,
      knowledge,
      entities,
      agentRules,
      conceptGraph,
    };
  }
  return cached;
}
