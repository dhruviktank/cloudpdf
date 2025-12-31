export async function getCroppedImage(
  imageSrc,
  crop,
  rotation = 0
) {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((res) => (image.onload = res));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const radians = (rotation * Math.PI) / 180;

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}
