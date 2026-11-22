import { describe, expect, it } from "vitest";
import { isRealDate, isTime, toMinutes } from "./time";

describe("isRealDate", () => {
  it("accepts real dates", () => {
    expect(isRealDate("2027-01-15")).toBe(true);
    expect(isRealDate("2028-02-29")).toBe(true);
  });

  it("rejects impossible dates", () => {
    expect(isRealDate("2027-02-29")).toBe(false);
    expect(isRealDate("2027-02-30")).toBe(false);
    expect(isRealDate("2027-04-31")).toBe(false);
    expect(isRealDate("2027-13-01")).toBe(false);
    expect(isRealDate("2027-00-10")).toBe(false);
  });

  it("treats 1900 as a non-leap year and 2000 as a leap year", () => {
    expect(isRealDate("1900-02-29")).toBe(false);
    expect(isRealDate("2000-02-29")).toBe(true);
  });

  it("rejects other formats", () => {
    expect(isRealDate("1/15/2027")).toBe(false);
    expect(isRealDate("2027-1-15")).toBe(false);
    expect(isRealDate("")).toBe(false);
  });
});

describe("isTime and toMinutes", () => {
  it("accepts 24-hour HH:MM", () => {
    expect(isTime("00:00")).toBe(true);
    expect(isTime("23:59")).toBe(true);
  });

  it("rejects out-of-range or 12-hour times", () => {
    expect(isTime("24:00")).toBe(false);
    expect(isTime("18:60")).toBe(false);
    expect(isTime("7:00")).toBe(false);
    expect(isTime("7pm")).toBe(false);
  });

  it("converts to minutes since midnight", () => {
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("18:30")).toBe(1110);
    expect(toMinutes("23:59")).toBe(1439);
  });
});
