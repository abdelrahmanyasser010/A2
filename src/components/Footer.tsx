import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer" id="story">
      <div className="footerLead">
        <p className="eyebrow">A² / MEN&apos;S WEAR</p>
        <h2>More than clothes.<br />A point of view.</h2>
      </div>
      <div className="footerGrid">
        <div>
          <strong>Shop</strong>
          <Link href="/shop">All products</Link>
          <Link href="/shop?collection=new-drop">New drop</Link>
          <Link href="/wishlist">Wishlist</Link>
        </div>
        <div>
          <strong>Help</strong>
          <a href="#">Shipping & returns</a>
          <a href="#">Size guide</a>
          <Link href="/account/orders">Track order</Link>
        </div>
        <div>
          <strong>Follow</strong>
          <a href="#">Instagram</a>
          <a href="#">TikTok</a>
          <a href="#">Facebook</a>
        </div>
      </div>
      <div className="footerBottom"><span>© 2026 A²</span><span>TWO MINDS. ONE VISION.</span></div>
    </footer>
  );
}
