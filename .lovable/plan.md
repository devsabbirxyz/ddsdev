## সমস্যা

`/admin/products/new` থেকে প্রোডাক্ট তৈরি করার সময় error:
> new row for relation "products" violates check constraint "products_delivery_type_check"

কারণ — `src/routes/admin/products.new.tsx` ডিফল্ট `delivery_type: "instant_text"` পাঠায়, কিন্তু DB constraint শুধু এই ৫টা মান allow করে:
`account`, `subscription`, `downloadable`, `method`, `text_link`

## ফিক্স (একটাই ছোট চেঞ্জ)

`src/routes/admin/products.new.tsx`-এ `create()` ফাংশনে:
- `delivery_type: "instant_text"` → `delivery_type: "text_link"` (ডিফল্ট হিসেবে, পরে edit পেজে বদলানো যাবে)

এটাই যথেষ্ট — DB schema বা constraint টাচ করার দরকার নেই। নতুন প্রোডাক্ট তৈরি হবে, তারপর `/admin/products/$id` edit পেজে গিয়ে সঠিক delivery type সিলেক্ট করা যাবে।

---

বিকল্প: যদি আপনি চান constraint-এ `instant_text` যোগ করি (যাতে instant text delivery আলাদা option হিসেবে থাকে), সেটা migration লাগবে। বলুন কোনটা চান।
