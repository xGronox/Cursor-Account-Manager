# 💳 Card Filter & Bulk Selection Feature

## ✅ **Fitur yang Ditambahkan**

### 1. **Card Filtering**

- **Text Search**: Filter berdasarkan card number, type, expiry
- **Type Filter**: Dropdown untuk filter berdasarkan card type (Visa, MasterCard, etc.)
- **Real-time**: Filter langsung update saat user mengetik

### 2. **Bulk Selection**

- **Individual Selection**: Checkbox pada setiap card
- **Select All**: Checkbox untuk select semua cards yang visible
- **Visual Feedback**: Selected cards mendapat highlight biru

### 3. **Bulk Actions**

- **Delete Selected**: Hapus semua cards yang dipilih
- **Clear Selection**: Bersihkan semua selection
- **Selection Counter**: Menampilkan jumlah cards yang dipilih

## 🎯 **UI Components**

### **Filter Section**

```html
<div class="card-filters">
  <div class="filter-row">
    <input type="text" id="cardFilterInput" placeholder="Filter cards..." />
    <select id="cardTypeFilter">
      <option value="">All Types</option>
      <option value="visa">Visa</option>
      <option value="mastercard">MasterCard</option>
      <!-- etc -->
    </select>
  </div>

  <div class="bulk-actions">
    <label><input type="checkbox" id="selectAllCards" /> Select All</label>
    <button id="deleteSelectedBtn">Delete Selected (0)</button>
    <button id="clearSelectionBtn">Clear Selection</button>
  </div>
</div>
```

### **Card Item dengan Checkbox**

```html
<div class="card-item">
  <div class="card-checkbox">
    <input type="checkbox" class="card-select" />
  </div>
  <!-- existing card content -->
</div>
```

## 🔧 **JavaScript Functionality**

### **1. Filter Logic**

```javascript
filterCards() {
  cardItems.forEach(cardItem => {
    const matchesSearch = card.number.includes(search) ||
                         card.type.includes(search) ||
                         card.expiry.includes(search);
    const matchesType = !typeFilter || card.type === typeFilter;

    cardItem.style.display = (matchesSearch && matchesType) ? "flex" : "none";
  });
}
```

### **2. Selection Management**

```javascript
toggleCardSelection(cardId, selected) {
  if (selected) {
    this.selectedCards.add(cardId);
  } else {
    this.selectedCards.delete(cardId);
  }
  this.updateSelectionUI();
}
```

### **3. Bulk Delete**

```javascript
async deleteSelectedCards() {
  const selectedArray = Array.from(this.selectedCards);
  for (const cardId of selectedArray) {
    await this.removePaymentCard(cardId, false);
  }
  this.clearSelection();
  await this.loadPaymentCards();
}
```

## 🎨 **CSS Styling**

### **Filter Styles**

```css
.card-filters {
  background: var(--card-bg);
  border-radius: 6px;
  padding: 10px;
  margin: 10px 0;
}

.filter-row {
  display: flex;
  gap: 10px;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid var(--border-color);
  padding-top: 8px;
}
```

### **Selection Visual**

```css
.card-item.selected {
  background: #e3f2fd;
  border-color: #2196f3;
}

.card-checkbox {
  margin-right: 8px;
}
```

## 🎯 **User Experience**

### **Filter Workflow:**

1. User types in filter input → cards filtered real-time
2. User selects card type → additional filter applied
3. Filters work together (AND logic)

### **Selection Workflow:**

1. User clicks card checkbox → card selected
2. User clicks "Select All" → all visible cards selected
3. User clicks "Delete Selected" → confirmation + bulk delete
4. User clicks "Clear Selection" → all selections cleared

### **Smart Features:**

- **Auto-hide filters** when no cards exist
- **Indeterminate checkbox** when partially selected
- **Selection persistence** during filtering
- **Confirmation dialog** for bulk delete

## 📋 **Files Modified:**

- ✅ `sidepanel.html` - Added filter UI and updated card template
- ✅ `sidepanel.css` - Added filter and selection styles
- ✅ `sidepanel.js` - Added filter logic, selection management, bulk actions
- ✅ `CARD_FILTER_FEATURE.md` - Documentation

## 🎯 **Benefits:**

- **Better Organization**: Easy to find specific cards
- **Bulk Management**: Delete multiple cards efficiently
- **Enhanced UX**: Professional card management interface
- **Performance**: Filter without API calls

---

**Feature Complete** 🚀 - Card filtering dan bulk selection siap digunakan!
