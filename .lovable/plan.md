## Goal
Light mode-এ সাইটের বাম দিকের (এবং অন্যান্য জায়গার) neon/purple radial glow effect পুরোপুরি সরিয়ে ফেলা — শুধু আসল সাদা background দেখাবে। Dark mode আগের মতোই থাকবে।

## Change
`src/styles.css` — light theme block-এ `--gradient-glow` override করে `none` করে দেব। এতে `.bg-gradient-glow` utility এবং inline `var(--gradient-glow)` ব্যবহারকারী সব element (homepage hero, testimonial section, blog headers, about, admin, admin-login, coming-soon) light mode-এ কোনো glow render করবে না। Dark mode-এর token অপরিবর্তিত।

```css
:root, .light {
  --gradient-glow: none;
}
```

কোনো component file বা layout পরিবর্তন লাগবে না — শুধু একটি token override।
