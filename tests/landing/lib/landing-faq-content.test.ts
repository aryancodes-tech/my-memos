import { describe, expect, it } from "vitest";
import {
  flattenFaqAnswerForSchema,
  resolveFaqLinkHref,
  resolveLandingFaqItems,
  type LandingFaqItem,
} from "@/lib/landing-faq-content";

describe("resolveFaqLinkHref", () => {
  it("returns relative paths when origin is empty", () => {
    expect(resolveFaqLinkHref("", "/demo/")).toBe("/demo/");
  });

  it("joins absolute origins without double slashes", () => {
    expect(resolveFaqLinkHref("https://www.mymemos.in/", "/demo/")).toBe(
      "https://www.mymemos.in/demo/",
    );
  });
});

describe("resolveLandingFaqItems", () => {
  it("resolves link segments for a production origin", () => {
    const items = resolveLandingFaqItems("https://www.mymemos.in");
    expect(items.length).toBeGreaterThan(0);

    const demo = items.find((item) =>
      item.question.includes("try MyMemos before installing"),
    );
    expect(demo?.answerSegments?.some((segment) => segment.type === "link")).toBe(true);
    const link = demo?.answerSegments?.find((segment) => segment.type === "link");
    expect(link && link.type === "link" ? link.href : "").toBe("https://www.mymemos.in/demo/");
  });

  it("keeps relative demo links when origin is unset", () => {
    const items = resolveLandingFaqItems("");
    const demo = items.find((item) => item.answerSegments?.some((s) => s.type === "link"));
    const link = demo?.answerSegments?.find((segment) => segment.type === "link");
    expect(link && link.type === "link" ? link.href : "").toBe("/demo/");
  });
});

describe("flattenFaqAnswerForSchema", () => {
  it("returns plain answer when segments are missing or empty", () => {
    const item: LandingFaqItem = { question: "Q", answer: "Plain answer" };
    expect(flattenFaqAnswerForSchema(item)).toBe("Plain answer");
    expect(flattenFaqAnswerForSchema({ ...item, answerSegments: [] })).toBe("Plain answer");
  });

  it("joins text and resolved link hrefs", () => {
    const item: LandingFaqItem = {
      question: "Q",
      answer: "fallback",
      answerSegments: [
        { type: "text", text: "Try " },
        { type: "link", path: "/demo/", href: "https://example.com/demo/", label: "here" },
        { type: "text", text: "." },
      ],
    };
    expect(flattenFaqAnswerForSchema(item)).toBe("Try https://example.com/demo/.");
  });
});
