import { Languages, Themes, Answers } from './storage';

const AVAILABLE_THEMES: { [key in Languages]: Themes[] } = {
    [Languages.English]:    [Themes.Character, Themes.Animals, Themes.Objects],
    [Languages.Arabic]:     [Themes.Character],
    [Languages.Chinese]:    [Themes.Character],
    [Languages.German]:     [Themes.Character, Themes.Animals],
    [Languages.Spanish]:    [Themes.Character, Themes.Animals],
    [Languages.French]:     [Themes.Character, Themes.Animals, Themes.Objects],
    [Languages.Hebrew]:     [Themes.Character],
    [Languages.Italian]:    [Themes.Character, Themes.Animals],
    [Languages.Japanese]:   [Themes.Character, Themes.Animals],
    [Languages.Korean]:     [Themes.Character],
    [Languages.Dutch]:      [Themes.Character],
    [Languages.Polish]:     [Themes.Character],
    [Languages.Portuguese]: [Themes.Character],
    [Languages.Russian]:    [Themes.Character],
    [Languages.Turkish]:    [Themes.Character],
    [Languages.Indonesian]: [Themes.Character],
};

class WinResult {
    /**
     * Proposition identifier
     */
    propositionId = 0;
    /**
     * Base proposition identifier
     */
    basePropositionId = 0;
    /**
     * Proposition submitter
     */
    submittedBy = "";
    /**
     * Name of the proposition
     */
    name = "";
    /**
     * Picture URL of the proposition
     */
    pictureUrl = "";
    /**
     * Description of the proposition
     */
    description = "";

    reset() {
        this.propositionId = 0;
        this.basePropositionId = 0;
        this.submittedBy = "";
        this.name = "";
        this.pictureUrl = "";
        this.description = "";
    }
}
class AnswerResult {
    /**
     * Represents if Akinator won or not
     */
    won = false;
    /**
     * Represents the file name of Akinator's attitude
     */
    akitude = "";
    /**
     * Represents the step of how far the game has gone
     */
    step = 0;
    /**
     * Represents the progression in percentage (%) of the game
     */
    progression = 0;
    /**
     * Represents the currently asked question
     */
    question = "";
    /**
     * Represents if Akinator lost or not
     */
    ko = false;

    reset() {
        this.won = false;
        this.akitude = "";
        this.step = 0;
        this.progression = 0;
        this.question = "";
        this.ko = false;
    }
}

class AkinatorClient {
    private _session = "";
    private _signature = "";
    private _url = "";
    private _identifiant = "";
    
    /**
     * The language Akinator will use
     */
    language: Languages = Languages.English;
    /**
     * Child mode disables NSFW
     */
    childMode: boolean = true;
    /**
     * Theme to use (some themes might not be available to all languages)
     */
    theme: Themes = Themes.Character;

    private _akitude = "";
    private _progression = "";
    private _question = "";
    private _step = "";

    private _step_last_proposition = "";

    // winning
    private _idProposition = "";
    private _idBaseProposition = "";
    private _nameProposition = "";
    private _descriptionProposition = "";
    private _photo = "";
    private _pseudo = "";
    private _flagPhoto = 0;

    private _currentAnswerResult = new AnswerResult();
    private _currentWinResult = new WinResult();

    // getters
    
    /**
     * Represents the latest result of the latest answer
     */
    public get answerResult() { return this._currentAnswerResult; }
    /**
     * Represents the latest win result 
     */
    public get winResult() { return this._currentWinResult; }

    /**
     * Represents the file name of Akinator's attitude
     */
    public get akitude() { return this._akitude; }
    /**
     * Represents the progression in percentage (%) of the game
     */
    public get progression(): number { return Number.parseInt(this._progression); }
    /**
     * Represents the currently asked question
     */
    public get question() { return this._question; }
    /**
     * Represents the step of how far the game has gone
     */
    public get step(): number { return Number.parseInt(this._step); }

    /**
     * Represents if Akinator won or not
     */
    public get won() { return this.answerResult.won; }
    /**
     * Represents if Akinator lost or not
     */
    public get ko() { return this.answerResult.ko; }

    /**
     * Creates a new Akinator client.
     * @param language The language Akinator will use
     * @param childMode Child mode disables NSFW
     * @param theme Theme to use (some themes might not be available to all languages)
     */
    constructor(language: Languages, childMode: boolean, theme: Themes) {
        this.language = language;
        this.childMode = childMode;
        this.theme = theme;
    }

    #getChildModeString() { return `${this.childMode}`; }
    #getThemeAsNumber() { return this.theme as number; }

    static #createForm(options: any) {
        const formData = new FormData();

        for (const [key, value] of Object.entries(options))
            formData.append(key, value as string);

        return formData;
    }

    /**
     * Starts a new akinator game under this client
     * @returns First question result
     */
    async start(): Promise<AnswerResult> {
        this.#resetResults();
        await this.#fetchRegion(this.language);

        const request = await this.#request("/game", { 
            method: "POST",
            body: AkinatorClient.#createForm({
                sid: this.#getThemeAsNumber(),
                cm: this.#getChildModeString()
            })
        });

        if (request.status != 200)
            throw new Error("HTTP Error: " + request.statusText);

        const response = await request.text();
        const sessionMatch = response.match(/name="session" id="session" value="([^"]+)"/);
        const signatureMatch = response.match(/name="signature" id="signature" value="([^"]+)"/);

        if (sessionMatch && signatureMatch) {
            this._session = sessionMatch[1];
            this._signature = signatureMatch[1];
        }

        const questionMatch = response.match(/<div class="bubble-body"><p class="question-text" id="question-label">(.*?)<\/p><\/div>/);
        if (questionMatch && questionMatch[1])
            this._question = questionMatch[1];
        
        const identifiantMatch = response.match(/localStorage\.setItem\('identifiant', '([^']+)'\);/);
        if (identifiantMatch && identifiantMatch[1])
            this._identifiant = identifiantMatch[1];

        this._progression = "0.00000";
        this._step = "0";
        
        this._currentAnswerResult.akitude = "defi.png";
        this._currentAnswerResult.step = Number.parseInt(this._step);
        this._currentAnswerResult.progression = Number.parseFloat(this._progression);
        this._currentAnswerResult.question = this._question;

        return this._currentAnswerResult;
    }

    #update(action: string, response: any) {
        if (action == "answer" || action == "back") {
            const { akitude, step, progression, question, completion } = response;
            if (completion == "KO") {
                this._currentAnswerResult.ko = true;
                return this._currentAnswerResult;
            }

            this._akitude = akitude;
            this._step = step;
            this._progression = progression;
            this._question = question;

            this._currentAnswerResult.akitude = this._akitude;
            this._currentAnswerResult.step = Number.parseInt(this._step);
            this._currentAnswerResult.progression = Number.parseFloat(this._progression);
            this._currentAnswerResult.question = this._question;

            return this._currentAnswerResult;
        }
        
        const { name_proposition, description_proposition, pseudo, photo, flag_photo } = response;
        
        this._nameProposition = name_proposition;
        this._descriptionProposition = description_proposition;
        this._pseudo = pseudo;
        this._photo = photo;
        this._flagPhoto = flag_photo;
    
        this._currentWinResult.propositionId = Number.parseInt(this._idProposition);
        this._currentWinResult.basePropositionId = Number.parseInt(this._idBaseProposition);
        this._currentWinResult.submittedBy = this._pseudo;
        this._currentWinResult.name = this._nameProposition;
        this._currentWinResult.pictureUrl = this._photo;
        this._currentWinResult.description = this._descriptionProposition;
        
        this._currentAnswerResult.won = true;
        
        return this._currentAnswerResult;
    }

    #resetResults() {
        this._currentWinResult.reset();
        this._currentAnswerResult.reset();
    }

    async #fetchRegion(language: Languages) {
        this.language = language;
        this._url = `https://${language}.akinator.com`;

        const request = await this.#request("", { method: "GET" });

        if (request.status != 200)
            throw new Error("HTTP Error: " + request.statusText);

        const availableThemes: Themes[] = AVAILABLE_THEMES[this.language];
        if (!availableThemes.includes(this.theme))
            throw new Error("Theme not supported in this language. Sorry!");
    }

    async #request(endpoint: string, options: RequestInit) {
        return await fetch(this._url + endpoint, options);
    }

    // https://en.akinator.com/answer
    /**
     * Answers Akinator
     * @param answer The answer
     * @returns Question resulting this answer
     */
    async answer(answer: Answers) : Promise<AnswerResult> {
        const request = await this.#request("/answer", { 
            method: "POST",
            body: AkinatorClient.#createForm({
                step: this._step,
                progression: this._progression,
                sid: this.#getThemeAsNumber(),
                cm: this.#getChildModeString(),
                answer: answer as number,
                step_last_proposition: this._step_last_proposition,
                session: this._session,
                signature: this._signature
            })
        });

        const response = await request.json();

        if (request.status != 200)
            throw new Error("HTTP Error: " + request.statusText);

        const idProposition = response["id_proposition"];

        return this.#update(idProposition ? "win" : "answer", response) as AnswerResult;
    }

    // https://en.akinator.com/cancel_answer
    /**
     * Corrects an answer and goes back
     * @returns Previous question
     */
    async back(): Promise<AnswerResult> {
        if (this._step == "0") throw new Error("Cannot go any further.");

        const request = await this.#request("/cancel_answer", { 
            method: "POST",
            body: AkinatorClient.#createForm({
                step: this._step,
                progression: this._progression,
                sid: this.#getThemeAsNumber(),
                cm: this.#getChildModeString(),
                session: this._session,
                signature: this._signature
            })
        });

        const response = await request.json();

        if (request.status != 200)
            throw new Error("HTTP Error: " + request.statusText);

        return this.#update("back", response) as AnswerResult;
    }

    
    // https://en.akinator.com/exclude
    /**
     * Continues the game even if Akinator won
     */
    async continue() {
        if (!this.won) throw new Error("You cannot continue a game that's ongoing.");
        if (this.ko) throw new Error("You cannot continue because Akinator has lost.");

        const request = await this.#request("/exclude", { 
            method: "POST",
            body: AkinatorClient.#createForm({
                step: this._step,
                sid: this.#getThemeAsNumber(),
                cm: this.#getChildModeString(),
                progression: this._progression,
                session: this._session,
                signature: this._signature
            })
        });

        this._currentAnswerResult.won = false;

        const response = await request.json();

        if (request.status != 200)
            throw new Error("HTTP Error: " + request.statusText);

        return this.#update("back", response) as AnswerResult;
    }

    // https://en.akinator.com/choice
    /**
     * Tells Akinator he won
     */
    async submitWin() {
        if (!this.won) throw new Error("You cannot submit Akinator's result while the game is ongoing.");

        const request = await this.#request("/choice", { 
            method: "POST",
            body: AkinatorClient.#createForm({
                sid: this.#getThemeAsNumber(),
                pid: this._idProposition,
                identifiant: this._identifiant,
                pflag_photo: this._flagPhoto,
                charac_name: this._nameProposition,
                charac_desc: this._descriptionProposition,
                session: this._session,
                signature: this._signature,
                step: this._step,
            })
        });

        if (request.status != 302 && request.status != 200)
            throw new Error("HTTP Error: " + request.statusText);
    }
}

export { AkinatorClient, Languages, Themes, Answers };
