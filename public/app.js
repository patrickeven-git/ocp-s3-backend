const fileList = document.getElementById("fileList");
const fileInput = document.getElementById("fileInput");

async function loadFiles() {
  const res = await fetch("/api/objects");
  const files = await res.json();
  fileList.innerHTML = "";
  files.forEach(f => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `/api/download/${f.Key}`;
    a.textContent = `${f.Key} (${f.Size} bytes)`;
    li.appendChild(a);
    fileList.appendChild(li);
  });
}

async function uploadFile() {
  const file = fileInput.files[0];
  if (!file) return alert("Select a file first");

  const formData = new FormData();
  formData.append("file", file);

  await fetch("/api/upload", {
    method: "POST",
    body: formData
  });

  fileInput.value = "";
  loadFiles();
}

loadFiles();
