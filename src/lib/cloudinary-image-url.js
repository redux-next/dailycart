export function cloudinaryImageUrl(url, width = 1200) {
  if (typeof url !== "string" || !url.includes("/image/upload/")) {
    return url || "";
  }

  const transformations = `f_auto,q_auto,w_${width},c_limit`;
  return url.replace(
    /\/image\/upload\/(?:f_auto,q_auto,w_\d+,c_limit\/)?/,
    `/image/upload/${transformations}/`
  );
}
