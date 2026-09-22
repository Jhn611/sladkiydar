# Перегенерация людей для первого блока

Режим: встроенный image_gen, precise-object-edit. Изменены люди на двух одобренных кадрах версии 5: более естественная детализация лиц, кожи, волос и рук. Сохранены выбранные большие наборы и общий кадр. Референсы: image 1 — дети, image 2 — взрослые.

Перед публикацией проверены сборка сайта, отображение обоих слайдов на компьютере и телефоне, загрузка адаптивных изображений и открытие формы.

## Файлы

- Взрослые: [основной WebP](../apps/web/public/images/hero-team-people-20260922.webp), [адаптивный WebP](../apps/web/public/images/hero-team-people-20260922-768.webp).
- Дети: [основной WebP](../apps/web/public/images/hero-children-people-20260922.webp), [адаптивный WebP](../apps/web/public/images/hero-children-people-20260922-768.webp).
- Исходники: 1448×1086 PNG, сохранены в `.cache/hero-people/`.
- Экспорт: 1440×1080 и 768×576, WebP quality 90. Только изменение размера и формата, без дополнительного программного редактирования.

## Промпты

### Дети

```text
EDIT ONLY IMAGE 1: regenerate the GIRL ON THE LEFT and BOY ON THE RIGHT in the cozy home, both around 7–9 years old. Keep her cream knitted sweater with small red details and his navy knitted sweater. Preserve their current warm, spontaneous smiles and youthful facial proportions. Child skin should be naturally smooth with delicate texture, no adult wrinkles or heavy makeup. Preserve their large red-filled and pink-filled square Kinder gift sets exactly in the current positions. IMAGE 2 is not the edit target.
Use case: precise-object-edit / photorealistic people regeneration. The user specifically wants the PEOPLE to be regenerated at convincingly photographic quality. Recreate the two people in this image as fresh, detailed, natural human subjects in the SAME composition. This is not a general sharpening pass and not a product enhancement. Edit the people: faces, eyes, hair, skin, hands, and their existing clothed bodies.
Retain the same overall appearance, apparent ages, genders, hair colors and hairstyles, clothing, seated poses, head positions and friendly relaxed expressions. Generate believable anatomical faces with natural asymmetry, coherent eyes and pupils, subtle real skin texture, soft cheek transitions, individual hair strands, realistic hairline, normal teeth and lips. Make the human faces clearly in focus and naturally detailed instead of soft waxy AI faces. Give hands correct joints, finger counts, nail shapes and skin creases with the SAME grips on the gift boxes. Match cloth knit/weave to natural photography. No beauty smoothing, plastic skin, exaggerated pores, sharpened noise, fashion glamour, uncanny eyes or porcelain teeth.
CRITICAL INVARIANTS: preserve the entire gift sets, their contents, packaging text, colors, arrangement, selected LARGE dimensions, mild inward yaw, backward tilt, position on the table and bow. Keep the product areas unchanged as closely as possible. No rotating, resizing, redesigning or replacing any gift or sweet. The hands must support these existing boxes, not rearrange them.
Preserve the original office/home background, furniture, window direction, table, soft natural daylight, exposure, white balance, contact shadows and 4:3 camera framing. Make the regenerated people match the existing scene lighting and gifts as if photographed together. Do not change the scene's time of day or introduce new sunlight streaks, flash, bloom, lens flares, oversaturation or HDR. Keep both heads and complete gifts/bow fully within the frame. A single premium but natural lifestyle photograph, 50mm lens feel, natural optical depth of field, no collage, added captions, watermark or border.
```

### Взрослые

```text
EDIT ONLY IMAGE 2: regenerate the ADULT MAN ON THE LEFT and ADULT WOMAN ON THE RIGHT in the office, both around 30–35. Keep his navy sweater over a pale blue shirt and her beige blazer, existing hairstyles and natural friendly expressions. Render believable adult skin texture, fine facial detail, subtle beard hairs on the man and naturally detailed hair on the woman. Preserve the large blue-filled square gift and red heart-shaped gift with bow exactly in their current positions. IMAGE 1 is not the edit target.
Use case: precise-object-edit / photorealistic people regeneration. The user specifically wants the PEOPLE to be regenerated at convincingly photographic quality. Recreate the two people in this image as fresh, detailed, natural human subjects in the SAME composition. This is not a general sharpening pass and not a product enhancement. Edit the people: faces, eyes, hair, skin, hands, and their existing clothed bodies.
Retain the same overall appearance, apparent ages, genders, hair colors and hairstyles, clothing, seated poses, head positions and friendly relaxed expressions. Generate believable anatomical faces with natural asymmetry, coherent eyes and pupils, subtle real skin texture, soft cheek transitions, individual hair strands, realistic hairline, normal teeth and lips. Make the human faces clearly in focus and naturally detailed instead of soft waxy AI faces. Give hands correct joints, finger counts, nail shapes and skin creases with the SAME grips on the gift boxes. Match cloth knit/weave to natural photography. No beauty smoothing, plastic skin, exaggerated pores, sharpened noise, fashion glamour, uncanny eyes or porcelain teeth.
CRITICAL INVARIANTS: preserve the entire gift sets, their contents, packaging text, colors, arrangement, selected LARGE dimensions, mild inward yaw, backward tilt, position on the table and bow. Keep the product areas unchanged as closely as possible. No rotating, resizing, redesigning or replacing any gift or sweet. The hands must support these existing boxes, not rearrange them.
Preserve the original office/home background, furniture, window direction, table, soft natural daylight, exposure, white balance, contact shadows and 4:3 camera framing. Make the regenerated people match the existing scene lighting and gifts as if photographed together. Do not change the scene's time of day or introduce new sunlight streaks, flash, bloom, lens flares, oversaturation or HDR. Keep both heads and complete gifts/bow fully within the frame. A single premium but natural lifestyle photograph, 50mm lens feel, natural optical depth of field, no collage, added captions, watermark or border.
```
