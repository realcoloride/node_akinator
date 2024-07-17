// Language related
/**
 * Enumerates languages Akinator can speak in
 */
enum Languages {
    English = "en",
    Arabic = "ar",
    Chinese = "cn",
    German = "de",
    Spanish = "es",
    French = "fr",
    Hebrew = "il",
    Italian = "it",
    Japanese = "jp",
    Korean = "kr",
    Dutch = "nl",
    Polish = "pl",
    Portuguese = "pt",
    Russian = "ru",
    Turkish = "tr",
    Indonesian = "id"
}

/**
 * Enumerates themes that Akinator supports
 */
enum Themes {
    Character = 1,
    Animals = 14,
    Objects = 2
}

/**
 * Enumerates answers that Akinator supports
 */
enum Answers {
    Yes,
    No,
    IDontKnow,
    Probably,
    ProbablyNot
}

export { Languages, Themes, Answers };