import { getLanguages } from "../integrations/judge0";

export const fetchLanguages = async () => {
  const languages = await getLanguages();

  return languages.map((lang: any) => ({
    id: lang.id,
    name: lang.name,
  }));
};