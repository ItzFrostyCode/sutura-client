import type { CategoryLeaf } from './navTypes';
import { buildUnifiedColorColumn, DEPARTMENT_KEY_MAP } from './navColorColumn';

export interface NavItem {
  label: string;
  href: string;
  hex?: string;
}

export interface NavColumn {
  title: string;
  items: NavItem[];
}

export function getCategoryColumns(groupKey: string, cat?: CategoryLeaf): NavColumn[] {
  const dept = DEPARTMENT_KEY_MAP[groupKey] || '';

  if (groupKey === 'discover') {
    return [
      {
        title: 'EXPLORE SUTURA',
        items: [
          { label: 'Browse Tailor Map', href: '/map' },
          { label: 'About Sutura', href: '/#about' },
          { label: 'Alterations & Repairs', href: '/search?q=Alterations&category=alteration_repair' },
        ],
      },
      {
        title: 'SERVICES & ACCOUNT',
        items: [
          { label: 'My Customer Account', href: '/account' },
          { label: 'Register a Tailor Store', href: '/register' },
          { label: 'Track Order', href: '/track' },
        ],
      },
    ];
  }

  if (groupKey === 'wedding') {
    if (cat?.label.toLowerCase() === 'women') {
      return [
        {
          title: 'BRIDAL & FORMAL',
          items: [
            { label: 'Browse All Wedding Gowns', href: '/search?category=gown&tab=catalog&department=wedding' },
            { label: 'Custom Bridal Gowns', href: '/search?category=gown&tab=catalog&department=wedding' },
            { label: 'Modern Terno & Filipiniana', href: '/search?category=filipiniana&tab=catalog&department=wedding' },
            { label: 'Reception & Evening Dresses', href: '/search?category=gown&tab=catalog&department=wedding' },
          ],
        },
        {
          title: 'ENTOURAGE & ROLE',
          items: [
            { label: 'Bride', href: '/search?category=gown&tab=catalog&department=wedding' },
            { label: 'Bridesmaids', href: '/search?category=gown&tab=catalog&department=wedding' },
            { label: 'Mother of the Bride / Groom', href: '/search?category=gown&tab=catalog&department=wedding' },
            { label: 'Maid of Honor', href: '/search?category=gown&tab=catalog&department=wedding' },
          ],
        },
        buildUnifiedColorColumn('/search?category=gown&tab=catalog', 'wedding'),
        {
          title: 'ACCESSORIES',
          items: [
            { label: 'Bolero & Shawls', href: '/search?q=Bolero&tab=catalog&department=wedding' },
            { label: 'Bridal Veils', href: '/search?q=Veil&tab=catalog&department=wedding' },
            { label: 'Formal Wedding Accessories', href: '/search?q=Accessories&tab=catalog&department=wedding' },
          ],
        },
      ];
    }
    return [
      {
        title: 'WEDDING ATTIRE',
        items: [
          { label: 'Browse All Wedding Suits', href: '/search?category=suit&tab=catalog&department=wedding' },
          { label: 'Wedding Barong Tagalog', href: '/search?category=barong&tab=catalog&department=wedding' },
          { label: 'Bespoke Tuxedos', href: '/search?q=Tuxedo&category=suit&tab=catalog&department=wedding' },
          { label: 'Classic Barong', href: '/search?category=barong&tab=catalog&department=wedding' },
        ],
      },
      {
        title: 'WEDDING ROLE',
        items: [
          { label: 'Groom', href: '/search?q=Groom+Suit&category=suit&department=wedding' },
          { label: 'Groomsmen', href: '/search?q=Groomsmen+Suit&category=suit&department=wedding' },
          { label: 'Father of the Bride', href: '/search?q=Father+of+the+Bride&category=suit&department=wedding' },
          { label: 'Wedding Guest', href: '/search?q=Wedding+Guest&department=wedding' },
        ],
      },
      buildUnifiedColorColumn('/search?category=suit&tab=catalog', 'wedding'),
      {
        title: 'ACCESSORIES',
        items: [
          { label: 'Dress Shirts', href: '/search?q=Dress+Shirts&department=wedding' },
          { label: 'Ties & Bowties', href: '/search?q=Ties&department=wedding' },
          { label: 'Pocket Squares', href: '/search?q=Pocket+Square&department=wedding' },
          { label: 'Cufflinks', href: '/search?q=Cufflinks&department=wedding' },
        ],
      },
    ];
  }

  const name = cat?.label.toLowerCase() ?? '';

  if (name.includes('suit')) {
    return [
      {
        title: 'FEATURED',
        items: [
          { label: 'Store All Suits', href: `/search?category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'New Arrivals', href: `/search?category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'Best Selling Suits', href: `/search?category=suit&sortBy=top_sales${dept ? `&department=${dept}` : ''}` },
        ],
      },
      {
        title: 'COLLECTIONS',
        items: [
          { label: 'Premium', href: `/search?q=Premium+Suits&category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'Luxury', href: `/search?q=Luxury+Suits&category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'Black Label', href: `/search?q=Black+Label+Tuxedo&category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'European', href: `/search?q=European+Suits&category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'Studio', href: `/search?q=Studio+Suits&category=suit${dept ? `&department=${dept}` : ''}` },
        ],
      },
      {
        title: 'STYLES',
        items: [
          { label: 'Tuxedo Suits', href: `/search?q=Tuxedo+Suits&category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'Dinner Jackets', href: `/search?q=Dinner+Jackets&category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'Single Breasted', href: `/search?q=Single+Breasted&category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'Double Breasted', href: `/search?q=Double+Breasted&category=suit${dept ? `&department=${dept}` : ''}` },
        ],
      },
      buildUnifiedColorColumn('/search?category=suit', dept),
    ];
  }

  if (name.includes('tuxedo')) {
    return [
      {
        title: 'FEATURED',
        items: [
          { label: 'Store All Tuxedos', href: `/search?q=Tuxedos&category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'Classic Black Tie', href: `/search?q=Black+Tie&category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'Dinner Jackets', href: `/search?q=Dinner+Jackets&category=suit${dept ? `&department=${dept}` : ''}` },
        ],
      },
      {
        title: 'COLLECTIONS',
        items: [
          { label: 'Premium Tuxedos', href: `/search?q=Premium+Tuxedos&category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'Black Label', href: `/search?q=Black+Label&category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'Velvet Tuxedos', href: `/search?q=Velvet+Tuxedos&category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'Wedding Tuxedos', href: `/search?q=Wedding+Tuxedos&category=suit${dept ? `&department=${dept}` : ''}` },
        ],
      },
      buildUnifiedColorColumn('/search?category=suit&q=Tuxedo', dept),
      {
        title: 'ACCESSORIES',
        items: [
          { label: 'Bowties & Cummerbunds', href: `/search?q=Bowties${dept ? `&department=${dept}` : ''}` },
          { label: 'Tuxedo Shirts', href: `/search?q=Tuxedo+Shirts${dept ? `&department=${dept}` : ''}` },
          { label: 'Cufflinks', href: `/search?q=Cufflinks${dept ? `&department=${dept}` : ''}` },
        ],
      },
    ];
  }

  if (name.includes('shirt')) {
    return [
      {
        title: 'FEATURED',
        items: [
          { label: 'Store All Shirts', href: `/search?q=Shirts${dept ? `&department=${dept}` : ''}` },
          { label: 'Dress Shirts', href: `/search?q=Dress+Shirts${dept ? `&department=${dept}` : ''}` },
          { label: 'Casual Button-Downs', href: `/search?q=Casual+Shirts${dept ? `&department=${dept}` : ''}` },
        ],
      },
      {
        title: 'FABRICS & COLLARS',
        items: [
          { label: '100% Cotton', href: `/search?q=Cotton+Shirt${dept ? `&department=${dept}` : ''}` },
          { label: 'Linen Shirts', href: `/search?q=Linen+Shirt${dept ? `&department=${dept}` : ''}` },
          { label: 'Spread Collar', href: `/search?q=Spread+Collar${dept ? `&department=${dept}` : ''}` },
          { label: 'French Cuff', href: `/search?q=French+Cuff${dept ? `&department=${dept}` : ''}` },
        ],
      },
      buildUnifiedColorColumn('/search?q=Shirts', dept),
    ];
  }

  if (name.includes('blazer')) {
    return [
      {
        title: 'FEATURED',
        items: [
          { label: 'Store All Blazers', href: `/search?q=Blazers&category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'Wool Blazers', href: `/search?q=Wool+Blazers&category=suit${dept ? `&department=${dept}` : ''}` },
          { label: 'Summer Linen', href: `/search?q=Linen+Blazers${dept ? `&department=${dept}` : ''}` },
        ],
      },
      {
        title: 'STYLES',
        items: [
          { label: 'Single Breasted', href: `/search?q=Single+Breasted${dept ? `&department=${dept}` : ''}` },
          { label: 'Double Breasted', href: `/search?q=Double+Breasted${dept ? `&department=${dept}` : ''}` },
          { label: 'Dinner Jackets', href: `/search?q=Dinner+Jackets${dept ? `&department=${dept}` : ''}` },
          { label: 'Smart Casual', href: `/search?q=Casual+Blazers${dept ? `&department=${dept}` : ''}` },
        ],
      },
      buildUnifiedColorColumn('/search?q=Blazer&category=suit', dept),
    ];
  }

  if (name.includes('pant')) {
    return [
      {
        title: 'FEATURED',
        items: [
          { label: 'Store All Pants', href: `/search?q=Pants${dept ? `&department=${dept}` : ''}` },
          { label: 'Tailored Trousers', href: `/search?q=Tailored+Trousers${dept ? `&department=${dept}` : ''}` },
          { label: 'Pleated Trousers', href: `/search?q=Pleated+Trousers${dept ? `&department=${dept}` : ''}` },
        ],
      },
      {
        title: 'FITS',
        items: [
          { label: 'Slim Fit', href: `/search?q=Slim+Fit+Pants${dept ? `&department=${dept}` : ''}` },
          { label: 'Straight Fit', href: `/search?q=Straight+Fit+Pants${dept ? `&department=${dept}` : ''}` },
          { label: 'Relaxed Fit', href: `/search?q=Relaxed+Pants${dept ? `&department=${dept}` : ''}` },
        ],
      },
      buildUnifiedColorColumn('/search?q=Pants', dept),
    ];
  }

  if (name.includes('barong')) {
    return [
      {
        title: 'FEATURED',
        items: [
          { label: 'Store All Barong Tagalog', href: `/search?category=barong${dept ? `&department=${dept}` : ''}` },
          { label: 'Piña Barong', href: `/search?q=Piña+Barong&category=barong${dept ? `&department=${dept}` : ''}` },
          { label: 'Cocoon Barong', href: `/search?q=Cocoon+Barong&category=barong${dept ? `&department=${dept}` : ''}` },
          { label: 'Organza Barong', href: `/search?q=Organza+Barong&category=barong${dept ? `&department=${dept}` : ''}` },
        ],
      },
      {
        title: 'OCCASIONS & STYLES',
        items: [
          { label: 'Wedding Barong', href: `/search?q=Wedding+Barong&category=barong${dept ? `&department=${dept}` : ''}` },
          { label: 'Modern Office Barong', href: `/search?q=Office+Barong&category=barong${dept ? `&department=${dept}` : ''}` },
          { label: 'Short-Sleeve Barong', href: `/search?q=Short+Sleeve+Barong&category=barong${dept ? `&department=${dept}` : ''}` },
          { label: 'Hand-Embroidered', href: `/search?q=Embroidered+Barong&category=barong${dept ? `&department=${dept}` : ''}` },
        ],
      },
      buildUnifiedColorColumn('/search?category=barong', dept),
    ];
  }

  if (name.includes('filipiniana')) {
    return [
      {
        title: 'FEATURED',
        items: [
          { label: 'Store All Filipiniana', href: `/search?category=filipiniana${dept ? `&department=${dept}` : ''}` },
          { label: 'Modern Filipiniana', href: `/search?q=Modern+Filipiniana&category=filipiniana${dept ? `&department=${dept}` : ''}` },
          { label: 'Terno Gowns', href: `/search?q=Terno+Gowns&category=filipiniana${dept ? `&department=${dept}` : ''}` },
        ],
      },
      {
        title: 'STYLES',
        items: [
          { label: "Baro't Saya", href: `/search?q=Barot+Saya&category=filipiniana${dept ? `&department=${dept}` : ''}` },
          { label: 'Bolero & Shawls', href: `/search?q=Bolero${dept ? `&department=${dept}` : ''}` },
          { label: 'Formal Maria Clara', href: `/search?q=Maria+Clara&category=filipiniana${dept ? `&department=${dept}` : ''}` },
        ],
      },
      buildUnifiedColorColumn('/search?category=filipiniana', dept),
    ];
  }

  if (name.includes('casual')) {
    return [
      {
        title: 'FEATURED',
        items: [
          { label: 'Store All Casual Wear', href: `/search?q=Casual+Wear${dept ? `&department=${dept}` : ''}` },
          { label: 'Linen Shirts', href: `/search?q=Linen+Shirts${dept ? `&department=${dept}` : ''}` },
          { label: 'Tailored Polos', href: `/search?q=Polos${dept ? `&department=${dept}` : ''}` },
        ],
      },
      {
        title: 'COLLECTIONS',
        items: [
          { label: 'Chinos & Trousers', href: `/search?q=Chinos${dept ? `&department=${dept}` : ''}` },
          { label: 'Casual Jackets', href: `/search?q=Jackets${dept ? `&department=${dept}` : ''}` },
          { label: 'Resort Wear', href: `/search?q=Resort+Wear${dept ? `&department=${dept}` : ''}` },
        ],
      },
      buildUnifiedColorColumn('/search?q=Casual+Wear', dept),
    ];
  }

  if (name.includes('outerwear')) {
    return [
      {
        title: 'FEATURED',
        items: [
          { label: 'Store All Outerwear', href: `/search?q=Outerwear${dept ? `&department=${dept}` : ''}` },
          { label: 'Overcoats', href: `/search?q=Overcoats${dept ? `&department=${dept}` : ''}` },
          { label: 'Trench Coats', href: `/search?q=Trench+Coats${dept ? `&department=${dept}` : ''}` },
        ],
      },
      {
        title: 'STYLES',
        items: [
          { label: 'Raincoats', href: `/search?q=Raincoats${dept ? `&department=${dept}` : ''}` },
          { label: 'Bomber Jackets', href: `/search?q=Bomber+Jackets${dept ? `&department=${dept}` : ''}` },
          { label: 'Mac Coats', href: `/search?q=Coats${dept ? `&department=${dept}` : ''}` },
        ],
      },
      buildUnifiedColorColumn('/search?q=Outerwear', dept),
    ];
  }

  if (name.includes('accessories')) {
    return [
      {
        title: 'TIES & BOWTIES',
        items: [
          { label: 'Store All Accessories', href: `/search?q=Accessories${dept ? `&department=${dept}` : ''}` },
          { label: 'Silk Ties', href: `/search?q=Silk+Ties${dept ? `&department=${dept}` : ''}` },
          { label: 'Bowties', href: `/search?q=Bowties${dept ? `&department=${dept}` : ''}` },
        ],
      },
      {
        title: 'ACCENTS & HARDWARE',
        items: [
          { label: 'Pocket Squares', href: `/search?q=Pocket+Squares${dept ? `&department=${dept}` : ''}` },
          { label: 'Cufflinks', href: `/search?q=Cufflinks${dept ? `&department=${dept}` : ''}` },
          { label: 'Tie Clips', href: `/search?q=Tie+Clips${dept ? `&department=${dept}` : ''}` },
          { label: 'Scarves', href: `/search?q=Scarves${dept ? `&department=${dept}` : ''}` },
        ],
      },
      buildUnifiedColorColumn('/search?q=Accessories', dept),
    ];
  }

  if (name.includes('uniform')) {
    return [
      {
        title: 'OFFICE WEAR',
        items: [
          { label: 'Corporate Suits & Blazers', href: '/search?q=Corporate+Suits&category=uniform&department=office' },
          { label: 'Office Button-Downs', href: '/search?q=Office+Shirts&category=uniform&department=office' },
          { label: 'Executive Uniforms', href: '/search?q=Executive+Uniforms&category=uniform&department=office' },
        ],
      },
      {
        title: 'SPECIALIZED UNIFORMS',
        items: [
          { label: 'Medical Scrubs & Lab Gowns', href: '/search?q=Medical+Scrubs&category=uniform&department=office' },
          { label: 'Hotel & Hospitality', href: '/search?q=Hospitality+Uniforms&category=uniform&department=office' },
          { label: 'School Uniforms', href: '/search?q=School+Uniforms&category=uniform&department=office' },
        ],
      },
      buildUnifiedColorColumn('/search?category=uniform', 'office'),
    ];
  }

  if (name.includes('jersey')) {
    return [
      {
        title: 'FEATURED',
        items: [
          { label: 'Store All Jerseys', href: '/search?q=Jerseys&category=jersey&department=office' },
          { label: 'Basketball Jerseys', href: '/search?q=Basketball+Jersey&category=jersey&department=office' },
          { label: 'Volleyball Jerseys', href: '/search?q=Volleyball+Jersey&category=jersey&department=office' },
        ],
      },
      {
        title: 'CUSTOM SUBLIMATION',
        items: [
          { label: 'Full Sublimation Sets', href: '/search?q=Sublimation&category=jersey&department=office' },
          { label: 'Cycling Jerseys', href: '/search?q=Cycling+Jersey&category=jersey&department=office' },
          { label: 'Esports Jerseys', href: '/search?q=Esports+Jersey&category=jersey&department=office' },
        ],
      },
      buildUnifiedColorColumn('/search?q=Jerseys&category=jersey', 'office'),
    ];
  }

  return [
    {
      title: 'FEATURED',
      items: [
        { label: `Store All ${cat?.label ?? ''}`, href: `/search?q=${encodeURIComponent(cat?.label ?? name)}${dept ? `&department=${dept}` : ''}` },
      ],
    },
    buildUnifiedColorColumn(`/search?q=${encodeURIComponent(cat?.label ?? name)}`, dept),
  ];
}
