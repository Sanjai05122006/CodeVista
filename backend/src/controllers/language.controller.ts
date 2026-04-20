import { Request, Response } from "express";
import { fetchLanguages } from "../services/language.service";

export const getAllLanguages = async (req: Request, res: Response) => {
  try {
    const languages = await fetchLanguages();
    return res.status(200).json(languages);
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
    });
  }
};