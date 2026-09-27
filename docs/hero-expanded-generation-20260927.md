# Расширенные фото первого блока — 27.09.2026

Режим: встроенный image_gen, редактирование существующих фото (identity-preserve). Два прежних кадра расширены до квадратного формата за счёт продолжения фона сверху и стола снизу. Размеры карточки восстановлены до состояния перед переносом подписи поверх фото; сама подпись остаётся поверх изображения.

## Файлы

- Взрослые: [основной WebP](../apps/web/public/images/hero-team-expanded-20260927.webp), [мобильный WebP](../apps/web/public/images/hero-team-expanded-20260927-768.webp).
- Дети: [основной WebP](../apps/web/public/images/hero-children-expanded-20260927.webp), [мобильный WebP](../apps/web/public/images/hero-children-expanded-20260927-768.webp).
- Разрешения: 1254×1254 и 768×768. WebP quality 90; экспорт без увеличения исходников.
- Исходные PNG и параметры генерации сохранены в .cache/hero-expanded/. Предыдущие фото не перезаписаны.
- На разных экранах край квадратного изображения может немного кадрироваться: добавленный фон оставляет запас вокруг людей и наборов.

## Промпты

### Взрослые

```text
Use case: identity-preserve. Asset: square full-bleed photographic hero for an existing website. Input image is the EDIT TARGET, not loose inspiration. Expand/outpaint this exact approved landscape photo to a 1:1 SQUARE canvas, ideally 1536 x 1536 or higher. Keep the original full-width 4:3 photo as a large central horizontal band occupying 75% of the square height; add about 9% of the final height above it and 16% below it. Extend the office wall/window/shelves naturally at the top and continue the wooden tabletop and existing foreground at the bottom. Preserve the adult man and woman exactly: same faces, expression, hairstyle, clothes, pose, skin texture and scale relative to photo width. Preserve BOTH LARGE gift sets exactly, including size relative to hands, gentle inward perspective, box shapes, every chocolate wrapper and label, blue filler in man's rectangular box and red heart box/bow in woman's hands. Keep realistic original soft daylight, shadows, color balance, contact shadows and lens perspective. The whole of both heads, hands and gift boxes must remain in frame; do not zoom/crop/squeeze/stretch the existing content. Do not reduce the gifts or replace products. New peripheral content only; absolutely no duplicated subjects or boxes, extra gifts, altered fingers, distorted faces, painted borders, blurred frame, letterboxing or flat beige background bands. Full photographic detail to all four edges. The bottom 12% should be quiet extended table for a website caption that we will overlay separately; do not render captions, UI, watermarks, decorative hearts or badges. Return one standalone square photograph.
The two most recently displayed reference photographs are provided inline: image 1 is the adult man and woman in the office; image 2 is the girl and boy in the living room. For THIS output edit ONLY image 1. Do not blend the two images. Image 2 of the children is irrelevant to this output.
```

### Дети

```text
Use case: identity-preserve. Asset: square full-bleed photographic hero for an existing website. Input image is the EDIT TARGET, not loose inspiration. Expand/outpaint this exact approved landscape photo of a girl and a boy to a 1:1 SQUARE canvas, ideally 1536 x 1536 or higher. Keep the original full-width 4:3 photo as a large central horizontal band occupying 75% of the square height; add about 9% of the final height above it and 16% below it. Extend the cozy living room/window/shelves naturally above, and continue the same wooden tabletop below. Preserve the same girl and boy exactly: faces, smiles, hair, natural skin texture, cream/red-pattern cardigan and navy sweater, pose, hands and their scale relative to photo width. Preserve BOTH LARGE gift sets exactly including contents, all wrapper logos, sizes, proportions and gentle inward perspective: girl's box of chocolate, Raffaello and four eggs, boy's box with seven eggs, chocolate and Nutella bars. Retain the original photorealistic warm daylight, shadows, contact shadows, color balance, texture and lens perspective. Both heads, hands and complete gift boxes must remain safely in frame; no zooming, cropping, stretching or making the gifts smaller. Change only the newly revealed periphery. No new people, duplicated chocolates, malformed hands, distorted text/faces, extra gifts, colored border, smeared blurred frame, flat beige band or letterboxing. Extend the real scene continuously to all edges. Keep the lowest 12% a quiet continuation of the tabletop, for a separate website caption overlay; do not include UI, text overlays, decorative hearts, badges or watermarks. Return one standalone square photograph.
The two most recently displayed reference photographs are provided inline: image 1 is the adult man and woman in the office; image 2 is the girl and boy in the living room. For THIS output edit ONLY image 2. Do not blend the two images. Image 1 of the adults is irrelevant to this output.
```
