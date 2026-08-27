import qrcode
from PIL import Image, ImageDraw
import math

def create_rounded_qr(url, logo_path, output_path, qr_size=1200, logo_size=320):
    """
    Create a rounded QR code with centered logo
    """
    # Create QR code with higher quality
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    # Get QR code image at high resolution
    qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGBA')
    qr_img = qr_img.resize((qr_size, qr_size), Image.LANCZOS)
    
    # Create rounded rectangle mask for QR code
    mask = Image.new('L', (qr_size, qr_size), 0)
    draw = ImageDraw.Draw(mask)
    radius = 80  # Corner radius
    draw.rounded_rectangle([(0, 0), (qr_size, qr_size)], radius=radius, fill=255)
    
    # Apply rounded mask to QR code
    qr_img.putalpha(mask)
    
    # Load logo at full resolution first, then resize
    logo = Image.open(logo_path).convert('RGBA')
    
    # Create white background circle for logo area
    bg_size = logo_size + 40
    white_bg = Image.new('RGBA', (bg_size, bg_size), (0, 0, 0, 0))
    draw_bg = ImageDraw.Draw(white_bg)
    draw_bg.ellipse([(0, 0), (bg_size - 1, bg_size - 1)], fill=(255, 255, 255, 255))
    
    # Resize logo with best quality
    logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
    
    # Create circular mask for logo
    logo_mask = Image.new('L', (logo_size, logo_size), 0)
    draw_logo = ImageDraw.Draw(logo_mask)
    draw_logo.ellipse([(0, 0), (logo_size - 1, logo_size - 1)], fill=255)
    
    # Apply circular mask to logo
    logo.putalpha(logo_mask)
    
    # Calculate position to center logo
    logo_pos = ((qr_size - logo_size) // 2, (qr_size - logo_size) // 2)
    bg_pos = ((qr_size - bg_size) // 2, (qr_size - bg_size) // 2)
    
    # Create white background
    final_img = Image.new('RGBA', (qr_size, qr_size), (255, 255, 255, 255))
    
    # Paste white background then logo
    final_img.paste(white_bg, bg_pos, white_bg)
    final_img.paste(qr_img, (0, 0), qr_img)
    final_img.paste(logo, logo_pos, logo)
    
    # Save final image with maximum quality
    final_img.save(output_path, 'PNG', optimize=False)
    print(f"QR code saved to: {output_path}")

if __name__ == "__main__":
    url = "https://www.zadapharmacy.com/our-team"
    logo_path = "zada_logo.png"  # User needs to save their logo here
    output_path = "zada_qr_code.png"
    
    create_rounded_qr(url, logo_path, output_path)
