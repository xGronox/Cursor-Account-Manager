# 🚨 Account Deletion Feature Guide

## Overview

Fitur baru untuk menghapus akun Cursor secara otomatis telah ditambahkan ke Cursor Account Manager. Tersedia 2 jenis penghapusan:

## 🔴 Delete Free Account

**Workflow Otomatis:**

1. Membuka `cursor.com/dashboard?tab=settings`
2. Mencari dan mengklik tombol "Delete"
3. Mengisi konfirmasi "delete" pada input field
4. Mengklik tombol final "Delete"

## ⚡ Delete Pro Trial Account

**Workflow Otomatis:**

1. Membuka `cursor.com/dashboard?tab=billing`
2. Mengklik tombol "Manage Subscription"
3. Membuka Stripe billing portal (tab baru)
4. Mengklik "Cancel subscription"
5. Mengonfirmasi pembatalan subscription
6. Melanjutkan dengan workflow Delete Free Account

## 🛡️ Safety Features

### Triple Confirmation System

1. **First Confirmation**: Penjelasan lengkap proses dan dampak
2. **Second Confirmation**: Warning final tentang permanent deletion
3. **Third Confirmation**: Mengetik text konfirmasi yang spesifik:
   - Free Account: `"DELETE FREE ACCOUNT"`
   - Pro Trial: `"DELETE PRO TRIAL ACCOUNT"`

### Monitoring System

- Real-time status monitoring selama proses deletion
- Automatic timeout handling (30 detik per step)
- Error reporting dan fallback handling

## 📍 Location in UI

Kedua tombol berada di **Advanced Tools Panel**:

1. `💀 Delete Free Account`
2. `⚡ Delete Pro Trial Account`

## ⚠️ Important Warnings

### Permanent Action

- **TIDAK DAPAT DIBATALKAN** setelah konfirmasi final
- Semua data, settings, dan preferences akan hilang
- Account recovery tidak mungkin dilakukan

### Technical Requirements

- Harus login ke akun Cursor yang ingin dihapus
- Browser harus mengizinkan popup dan tab baru
- Extension memerlukan permission untuk cursor.com dan billing.stripe.com

## 🔧 Technical Implementation

### Files Added/Modified:

- ✅ `services/account-deletion.js` - Core deletion service
- ✅ `background.js` - Message handlers untuk deletion
- ✅ `sidepanel.html` - UI buttons untuk deletion
- ✅ `sidepanel.js` - Event handlers dan user interactions
- ✅ `manifest.json` - Additional permissions

### Safety Mechanisms:

- Multiple DOM selector fallbacks
- Retry logic untuk failed operations
- Progress monitoring dan status reporting
- Automatic cancellation pada timeout

## 🚀 Usage Instructions

1. **Open Sidebar**: Klik extension icon
2. **Navigate to Advanced Tools**: Klik "⚙️ Advanced Tools"
3. **Choose Deletion Type**:
   - Klik `💀 Delete Free Account` untuk free accounts
   - Klik `⚡ Delete Pro Trial Account` untuk pro/trial accounts
4. **Complete Confirmations**: Ikuti 3-step confirmation process
5. **Monitor Process**: Extension akan otomatis membuka tabs dan melakukan automation
6. **Final Verification**: Periksa cursor.com untuk memastikan account terhapus

## 🆘 Troubleshooting

### Process Stuck/Failed

- Check browser console untuk error messages
- Pastikan tidak ada popup blockers aktif
- Refresh cursor.com dan coba lagi
- Gunakan manual deletion jika automation gagal

### Permissions Issues

- Pastikan extension memiliki akses ke cursor.com
- Allow popups dan redirects untuk cursor.com
- Check browser tidak memblokir cross-site requests

---

**⚠️ DISCLAIMER**: Fitur ini melakukan permanent account deletion. Gunakan dengan sangat hati-hati dan pastikan Anda benar-benar ingin menghapus akun Cursor Anda.

