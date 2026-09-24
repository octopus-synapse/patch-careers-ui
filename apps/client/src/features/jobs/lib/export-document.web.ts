export async function exportResume(url: string): Promise<void> {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.click();
}

export async function exportLetter(text: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "cover-letter.txt";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
