// Run with: node patch-admin.js
// This patches client/src/pages/Admin.tsx to add schedule display in blocked numbers table

const fs = require('fs');
const filePath = 'client/src/pages/Admin.tsx';

let content = fs.readFileSync(filePath, 'utf8');
let changes = 0;

// 1. Add "กำหนดการ" column header in blocked numbers table
const oldHeader = `<TableHead>{language === "th" ? "ประเภทแทง" : "Bet Type"}</TableHead>
                        <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                        <TableHead className="text-right">{language === "th" ? "จัดการ" : "Actions"}</TableHead>`;

const newHeader = `<TableHead>{language === "th" ? "ประเภทแทง" : "Bet Type"}</TableHead>
                        <TableHead>{language === "th" ? "กำหนดการ" : "Schedule"}</TableHead>
                        <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                        <TableHead className="text-right">{language === "th" ? "จัดการ" : "Actions"}</TableHead>`;

if (content.includes(oldHeader)) {
  content = content.replace(oldHeader, newHeader);
  changes++;
  console.log('✅ Added schedule column header');
} else {
  console.log('⚠️  Could not find header pattern - may need manual edit');
}

// 2. Fix colspan from 5 to 6 in blocked numbers empty state
const oldColspan = `<TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            {language === "th" ? "ยังไม่มีเลขอั้น" : "No blocked numbers yet"}`;

const newColspan = `<TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            {language === "th" ? "ยังไม่มีเลขอั้น" : "No blocked numbers yet"}`;

if (content.includes(oldColspan)) {
  content = content.replace(oldColspan, newColspan);
  changes++;
  console.log('✅ Fixed colspan 5 → 6');
} else {
  console.log('⚠️  Could not find colspan pattern');
}

// 3. Add schedule cell in each blocked number row (after betType cell, before status cell)
const oldRowCell = `<TableCell>
                              {bn.betType 
                                ? betTypeNames[bn.betType as BetType][language]
                                : (language === "th" ? "ทุกประเภท" : "All")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={!!bn.isActive}`;

const newRowCell = `<TableCell>
                              {bn.betType 
                                ? betTypeNames[bn.betType as BetType][language]
                                : (language === "th" ? "ทุกประเภท" : "All")}
                            </TableCell>
                            <TableCell className="text-xs">
                              {(bn as any).startDate || (bn as any).endDate ? (
                                <div className="space-y-0.5">
                                  {(bn as any).startDate && (
                                    <div className="text-green-500">
                                      {language === "th" ? "เริ่ม" : "From"}: {new Date((bn as any).startDate).toLocaleString(language === "th" ? "th-TH" : "en-US")}
                                    </div>
                                  )}
                                  {(bn as any).endDate && (
                                    <div className="text-red-500">
                                      {language === "th" ? "ถึง" : "To"}: {new Date((bn as any).endDate).toLocaleString(language === "th" ? "th-TH" : "en-US")}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  {language === "th" ? "ตลอดไป" : "Permanent"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={!!bn.isActive}`;

if (content.includes(oldRowCell)) {
  content = content.replace(oldRowCell, newRowCell);
  changes++;
  console.log('✅ Added schedule cell in rows');
} else {
  console.log('⚠️  Could not find row cell pattern');
}

if (changes > 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`\n🎉 Done! ${changes}/3 patches applied to ${filePath}`);
} else {
  console.log('\n❌ No patches applied - file may have different formatting');
}
