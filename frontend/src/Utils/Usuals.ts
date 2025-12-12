export function GetColorFromLetters(word: string): string {
    if (word.length < 1) {
        throw new Error("Word must have at least one letter");
    }
    
    const colorMap: Record<string, string> = {
        "a": "#FF5733",
        "b": "#33FF57",
        "c": "#3357FF",
        "d": "#F1C40F",
        "e": "#9B59B6",
        "f": "#E74C3C",
        "g": "#1ABC9C",
        "h": "#34495E",
        "i": "#D35400",
        "j": "#8E44AD",
        "k": "#2ECC71",
        "l": "#3498DB",
        "m": "#E67E22",
        "n": "#BDC3C7",
        "o": "#16A085",
        "p": "#27AE60",
        "q": "#2980B9",
        "r": "#D35400",
        "s": "#C0392B",
        "t": "#F39C12",
        "u": "#7F8C8D",
        "v": "#2C3E50",
        "w": "#95A5A6",
        "x": "#ECF0F1",
        "y": "#E74C3C",
        "z": "#8E44AD"
    };
    
    const key = word[0].toLowerCase();
    return colorMap[key] || "#000000"; // Default to black if not found
}
