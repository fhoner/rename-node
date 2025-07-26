import { describe, it } from "node:test";
import { renameFile } from "./renamer";
import { RenameData } from "./model";
import { expect } from "chai";

describe("renamer", () => {
  it("should insert values", () => {
    const input =
      "%timestamp% - My fantastic tour - %name%, %street% %housenumber%, %city%";
    const data: RenameData = {
      name: "Stadt-Apotheke",
      street: "Marktstraße",
      housenumber: "1",
      city: "Nagold",
    };
    const result = renameFile(input, {
      timestamp: "2025-01-01 12:00:00",
      geo: data,
    });
    expect(result).to.equal(
      "2025-01-01 12:00:00 - My fantastic tour - Stadt-Apotheke, Marktstraße 1, Nagold",
    );
  });
});
