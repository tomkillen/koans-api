/**
 * Helper utility to generate some activities using Lorem Ipsum
 */

import { LoremIpsum } from "lorem-ipsum";
import { ActivityInfo } from "../services/activity/activity.model";

const textGenerator = new LoremIpsum();

const categories = [
  'Relaxation',
  'Self-Esteem',
  'Productivity',
  'Physical Health',
  'Social Connection',
];

const generateWords = (min = 1, max = 3): string => {
  return textGenerator.generateWords(Math.floor(min + (max - min) * Math.random()));
}

const generateParagraphs = (min = 1, max = 3): string => {
  return textGenerator.generateParagraphs(Math.floor(min + (max - min) * Math.random()));
}

const generateCategory = (): string => categories[Math.floor(categories.length * Math.random())];

const generateDuration = (): number => Math.floor(Math.random() * 20) + 1;

const generateDifficulty = (): number => Math.floor(Math.random() * 5) + 1;

let activityCounter = 0;

const generateActivity = (values?: Partial<ActivityInfo>): ActivityInfo => ({
  title: values?.title ?? generateWords(1, 3) + ` (${activityCounter++})`,
  category: values?.category ?? generateCategory(),
  description: values?.description ?? generateWords(5, 20),
  duration: values?.duration ?? generateDuration(),
  difficulty: values?.difficulty ?? generateDifficulty(),
  content: values?.content ?? generateParagraphs(1, 3),
});

export default generateActivity;