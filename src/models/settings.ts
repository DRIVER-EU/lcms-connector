export class Settings {
  private static instance: Settings = new Settings();

  private symbols: string[] = [];

  constructor() {
    if (Settings.instance) {
      throw new Error('Error: Instantiation failed: Use Settings.getInstance() instead of new.');
    }
    Settings.instance = this;
  }

  public static getInstance(): Settings {
    return Settings.instance;
  }

  public imageFolder: string;

  public symbolExists(symbol: string) {
    return this.symbols.indexOf(symbol) >= 0;
  }

  public addSymbol(symbol: string) { this.symbols.push(symbol); }
}
