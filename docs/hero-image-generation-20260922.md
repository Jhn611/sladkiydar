# Фотографии первого блока — 22 сентября 2026

Использован встроенный инструмент `image_gen`. Два новых синтетических lifestyle-кадра созданы по фотографиям наборов из витрины; это иллюстрации оформления, а не подтверждённые фотографии клиентов.

Входные референсы в порядке передачи:

1. `apps/web/public/images/gallery-blue-20260922.webp`
2. `apps/web/public/images/gallery-red-20260922.webp`
3. `apps/web/public/images/gallery-heart-20260922.webp`
4. `apps/web/public/images/gallery-pink-20260922.webp`

Параметры макета: одинаковые пропорции двух кадров, полные головы и коробки, запас вокруг людей и подарков. Для детей используются наборы 2 и 4, для взрослых — 1 и 3. Отдельные WebP-варианты для разных размеров экрана.

## Дети с наборами

```text
Use case: photorealistic-natural. Asset: production website hero carousel photograph for a Russian sweet gift shop, landscape 4:3 canvas, ideally 1536 x 1152.
Generate a NEW believable editorial lifestyle photograph of a boy and a girl around 7–9 years old, seated next to each other at a light wooden table in a real warm contemporary living room. Both wear ordinary comfortable knit clothes and have relaxed, natural happy expressions. A generous medium-wide composition shows both complete heads, shoulders, forearms, hands and two COMPLETE gift boxes. Each child presents one open box, resting its bottom edge firmly on the table and supporting its sides naturally.
Reference image 1 is the exact RED-FILLER square gift box the girl holds: two small Kinder Chocolate packs at the upper corners, central vertical Bueno, two Country, two Maxi, four foil eggs in the lower row and Raffaello sweets. Reference image 2 is the exact PINK-FILLER square gift box the boy holds: seven Kinder Surprise eggs, Country at upper sides, central Chocolate package, four small chocolate bars, two Bueno at the bottom and Nutella B-ready at the sides. Preserve the two reference products' recognisable layouts, packaging, proportions, actual materials and readable original brand designs. Do not substitute different assortments, add toys, roses, or extra gifts.
Lighting is critical: a single large window outside the left of frame supplies soft diffused neutral daylight; subtle warm room bounce, consistent light direction on the children AND boxes. Realistic contact shadows under fingers and boxes, gentle shadows within the filler, restrained foil reflections, realistic skin pores and fine hair. All people and products must look photographed together with the same lens, exposure and color temperature, never like pasted cutouts. Natural optical depth of field, 50mm equivalent, f/5.6: both faces and product arrangements clear, background only mildly soft.
Crop-safe art direction: step the camera back. Keep heads and outer box corners within the central 80% of the canvas; leave at least 10% clear space above heads, 8% beyond left/right arms, and a visible tabletop margin below both boxes. No important object touches an edge. Boxes have physically plausible hand-sized scale around 25–28 cm, not gigantic. No cropped hair, elbows, fingers, bows or box corners. No stretching or panoramic distortion. Single photograph, no collage, no border, no banner, no overlay lettering, no watermark. Joyful yet understated and authentically photographic, no artificial HDR, plastic skin, glamour retouching or orange cinematic glow.
```

## Коллеги с наборами

```text
Use case: photorealistic-natural. Asset: production website hero carousel photograph for a Russian sweet gift shop, landscape 4:3 canvas, ideally 1536 x 1152.
Generate a NEW believable editorial corporate lifestyle photograph: a man and a woman about 28–35, colleagues sitting comfortably next to one another behind a light oak meeting table in a real understated modern office. Business-casual clothes, pleasant spontaneous smiles. Medium-wide framing includes both full heads, torsos, natural forearms/hands and two ENTIRE open gift sets resting securely on the table, tilted gently toward the camera with contents visible. The man has the BLUE-FILLER square box; the woman has the red HEART-shaped box.
Reference image 1 is the exact blue box: two vertical Bueno packages at the outer sides, two Country near the top center, two Kinder Surprise eggs in the middle, four small chocolate bars at the bottom sides and two small Nutella jars at the bottom center. Reference image 2 is the exact red heart box, including its full red bow: six foil Kinder eggs at the left, two Country and Maxi/chocolate bars in the middle, Raffaello on the right. Preserve these exact identifiable product assortments, box shapes, filler colors, package designs and realistic relative dimensions. Do not mix the two assortments, invent extra products or turn the photo into flat packshots.
Lighting is critical: one large office window out of frame on the left, soft overcast daylight and gentle neutral bounce from the room. Faces, fingers, cardboard edges, crinkled wrappers and tabletop receive the SAME direction, intensity, white balance and softness of light. Visible grounded contact shadows under both boxes and hands; subtle occlusion shadows between sweets, realistic non-glowing foil highlights. Natural skin texture, fine flyaway hair, believable fabric and cardboard grain, modest everyday imperfections. People and gifts genuinely appear photographed together, not composited at different resolutions. 50mm equivalent, f/5.6, both faces and all gifts in clear focus with mildly softened office behind.
Crop-safe art direction: camera far enough back to keep complete heads, hands, both boxes and the entire heart bow inside the central 80% of the image. At least 10% headroom, 8% side clearance and visible tabletop below both gifts. Nothing important against the frame edges. Each box approximately 25–30 cm, realistically sized in hands, slight natural perspective. No cropped heads, arms, box corners or ribbon. No wide-angle distortion, plastic faces, excessive retouching, fake bokeh, harsh flash or HDR. No added text, logos outside the actual packages, watermarks, borders, montage or split screen. A single realistic, coherent photo with calm natural colors.
```

## Готовые файлы

- Взрослые: apps/web/public/images/hero-team-v4-20260922.webp и вариант -768.webp.
- Дети: apps/web/public/images/hero-children-v4-20260922.webp и вариант -768.webp.
- Размеры: 1440 × 1080 и 768 × 576, пропорции 4:3. Зум-анимация фотографии убрана, чтобы не обрезать края кадра.

## Коррекция перспективы и освещения

После генерации оба кадра отредактированы: наклон коробок и отдельных изделий согласован с камерой; видны объём бортиков, контактные тени и освещение упаковки от окна. Лица и фон сохранены. В эту правку переданы промежуточные кадры с детьми (image 1) и взрослыми (image 2).

### Дети

```text
EDIT ONLY IMAGE 1, the photograph of the girl and boy seated at a wooden table. Image 2 (the adult man and woman) is not the edit target. Girl retains her red-filled square Kinder/Raffaello set; boy retains his pink-filled square set with seven Kinder eggs.
Use case: precise-object-edit / physically coherent compositing correction.
The gift sets in this photo look like flat, overly bright studio packshots pasted in front of the people. CORRECT THAT SPECIFIC PROBLEM. Preserve the people's identities, facial expressions, clothes, room, camera framing and overall photo. Rebuild the gift boxes, their contents and the supporting hand contacts as genuinely three-dimensional objects photographed in this scene.
Geometry: each complete gift set must sit naturally tilted rather than perfectly facing the camera. Tilt the tops of the boxes away from camera around 25–30 degrees and turn them around the vertical axis about 12–18 degrees in slightly different directions. Clearly show real 4–5 cm cardboard sidewalls. Upper/back edges recede, so they look shorter than nearer lower edges; straight edges converge correctly. Apply this SAME camera projection to every package, egg, filler strand, printed label and the whole arrangement, not just the outer cardboard rim. The packaged sweets have real depth and wrap around curved or rectangular surfaces; avoid a single flat texture laid over the opening. The heart and its bow must have physical thickness and follow the tilted plane. Preserve the recognizable exact assortment and arrangement of each current gift, with no extra products. Reposition fingers minimally to support the boxes convincingly, with gripping fingers overlapping rims, realistic pressure and attachment, no floating box or impossible hand.
Integration: REMOVE the bright neutral studio illumination from the gifts. Re-light every surface with the actual soft window light in this room, matching the direction and softness visible on the people's faces and sleeves. Bring paper and wrapper whites down to the same exposure as other white objects/clothes in this scene; they must not glow or look cut out. Match warm/cool tint to the surrounding room, soften over-saturated red/blue/pink filler naturally, preserve brand colors within realistic scene illumination. Add soft but visible shadows from fingers onto rims, rims onto filler, eggs and bars onto one another, and grounded shadows where boxes touch the table. Include subtle ambient occlusion inside the arrangement and plausible broad foil highlights, no artificial shine. Match grain, microcontrast, lens sharpness and focus to the people; packages must not be sharper than the human faces. No hard cutout edges or halos.
The result must look like ONE ordinary high-quality camera photograph, with the gift sets really present in the hands. Change the gift geometry and its illumination, not simply overall color grading. Keep a landscape 4:3 image, complete heads and full boxes/bow inside the frame. No new overlay text, no border, no watermarks.
```

### Взрослые

```text
EDIT ONLY IMAGE 2, the photograph of the adult man and woman in the office. Image 1 (two children) is not the edit target. Man retains his blue-filled square set with two Nutella jars; woman retains her red heart-shaped Kinder/Raffaello set and bow.
Use case: precise-object-edit / physically coherent compositing correction.
The gift sets in this photo look like flat, overly bright studio packshots pasted in front of the people. CORRECT THAT SPECIFIC PROBLEM. Preserve the people's identities, facial expressions, clothes, room, camera framing and overall photo. Rebuild the gift boxes, their contents and the supporting hand contacts as genuinely three-dimensional objects photographed in this scene.
Geometry: each complete gift set must sit naturally tilted rather than perfectly facing the camera. Tilt the tops of the boxes away from camera around 25–30 degrees and turn them around the vertical axis about 12–18 degrees in slightly different directions. Clearly show real 4–5 cm cardboard sidewalls. Upper/back edges recede, so they look shorter than nearer lower edges; straight edges converge correctly. Apply this SAME camera projection to every package, egg, filler strand, printed label and the whole arrangement, not just the outer cardboard rim. The packaged sweets have real depth and wrap around curved or rectangular surfaces; avoid a single flat texture laid over the opening. The heart and its bow must have physical thickness and follow the tilted plane. Preserve the recognizable exact assortment and arrangement of each current gift, with no extra products. Reposition fingers minimally to support the boxes convincingly, with gripping fingers overlapping rims, realistic pressure and attachment, no floating box or impossible hand.
Integration: REMOVE the bright neutral studio illumination from the gifts. Re-light every surface with the actual soft window light in this room, matching the direction and softness visible on the people's faces and sleeves. Bring paper and wrapper whites down to the same exposure as other white objects/clothes in this scene; they must not glow or look cut out. Match warm/cool tint to the surrounding room, soften over-saturated red/blue/pink filler naturally, preserve brand colors within realistic scene illumination. Add soft but visible shadows from fingers onto rims, rims onto filler, eggs and bars onto one another, and grounded shadows where boxes touch the table. Include subtle ambient occlusion inside the arrangement and plausible broad foil highlights, no artificial shine. Match grain, microcontrast, lens sharpness and focus to the people; packages must not be sharper than the human faces. No hard cutout edges or halos.
The result must look like ONE ordinary high-quality camera photograph, with the gift sets really present in the hands. Change the gift geometry and its illumination, not simply overall color grading. Keep a landscape 4:3 image, complete heads and full boxes/bow inside the frame. No new overlay text, no border, no watermarks.
```

## Финальная правка: правые наборы направлены к центру

Изменён только поворот набора у мальчика и коробки-сердца у женщины. Правый внешний борт ближе к камере, левая внутренняя сторона уходит к центру кадра. Референс 1 — исправленный кадр с детьми; референс 2 — исправленный кадр со взрослыми.

### Дети

```text
EDIT IMAGE 1, the photo of TWO CHILDREN at the wooden table. Change ONLY the PINK-filled gift box held by the BOY ON THE RIGHT. Leave the girl and her red-filled square box unchanged. Image 2 is not the target.
Use case: precise-object-edit. Make ONLY this one geometric correction to the gift held by the person on the RIGHT of the photograph: rotate the ENTIRE gift box and its contents in real 3D so its front faces INWARD, toward the CENTER/LEFT of the composition, toward the other person's gift. The current right-hand gift faces outward; REVERSE ITS YAW, not its design.
Precise geometry: rotate the right person's gift about its vertical axis approximately 20–25 degrees so the RIGHT/OUTER edge is nearer the camera and the LEFT/INNER edge recedes toward the center of the table. Its front-surface normal should point toward the left half of the image. Show the RIGHT outer sidewall of this box, rather than the left sidewall currently visible. Preserve the natural backward tilt, lower edge resting on the table, and believable hand support; adjust only the supporting fingers as needed. Apply the same coherent inward perspective to the individual packages, eggs, wrappers, filler and printed designs inside the box, with proper foreshortening and receding edges.
Do NOT mirror the photograph or flip product labels; text must remain normally oriented. Do NOT simply rotate a flat rectangle in the image plane. The left person's gift is already correctly oriented inward: leave it untouched, and make the right gift's orientation a physically plausible counterpart facing toward it.
Preserve both people's faces, clothes and expressions, the LEFT person's entire gift, room, table, lighting direction, exposure, shadows, colors, framing and resolution. Match the already corrected natural daylight and contact shadows after rotating the right gift. Preserve its existing exact contents, packaging shape, color and any bow. Do not add/remove/replace products. Keep all heads, both complete boxes and the ribbon inside the 4:3 landscape frame. No new text or watermark.
```

### Взрослые

```text
EDIT IMAGE 2, the photo of the ADULT COUPLE in the office. Change ONLY the RED HEART-shaped gift held by the WOMAN ON THE RIGHT, including the heart's contents and bow. Leave the man and his blue-filled square box unchanged. Image 1 is not the target.
Use case: precise-object-edit. Make ONLY this one geometric correction to the gift held by the person on the RIGHT of the photograph: rotate the ENTIRE gift box and its contents in real 3D so its front faces INWARD, toward the CENTER/LEFT of the composition, toward the other person's gift. The current right-hand gift faces outward; REVERSE ITS YAW, not its design.
Precise geometry: rotate the right person's gift about its vertical axis approximately 20–25 degrees so the RIGHT/OUTER edge is nearer the camera and the LEFT/INNER edge recedes toward the center of the table. Its front-surface normal should point toward the left half of the image. Show the RIGHT outer sidewall of this box, rather than the left sidewall currently visible. Preserve the natural backward tilt, lower edge resting on the table, and believable hand support; adjust only the supporting fingers as needed. Apply the same coherent inward perspective to the individual packages, eggs, wrappers, filler and printed designs inside the box, with proper foreshortening and receding edges.
Do NOT mirror the photograph or flip product labels; text must remain normally oriented. Do NOT simply rotate a flat rectangle in the image plane. The left person's gift is already correctly oriented inward: leave it untouched, and make the right gift's orientation a physically plausible counterpart facing toward it.
Preserve both people's faces, clothes and expressions, the LEFT person's entire gift, room, table, lighting direction, exposure, shadows, colors, framing and resolution. Match the already corrected natural daylight and contact shadows after rotating the right gift. Preserve its existing exact contents, packaging shape, color and any bow. Do not add/remove/replace products. Keep all heads, both complete boxes and the ribbon inside the 4:3 landscape frame. No new text or watermark.
```
