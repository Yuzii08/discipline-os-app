const fs = require('fs');

function replaceFile(path, replacer) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    content = replacer(content);
    fs.writeFileSync(path, content, 'utf8');
}

// 1. app/(auth)/login.tsx
replaceFile('app/(auth)/login.tsx', (content) => {
    return content.replace('const { flatCard } = clay;', '');
});

// 2. app/(tabs)/arena.tsx
replaceFile('app/(tabs)/arena.tsx', (content) => {
    return content.replace(/const isDark = /g, '// const isDark = ')
                  .replace(/const { BG, CHR, SAGE, TERR, MUST } = tokens;/g, 'const { BG, CHR, SAGE, TERR } = tokens;');
});

// 3. app/(tabs)/leaderboard.tsx
replaceFile('app/(tabs)/leaderboard.tsx', (content) => {
    return content.replace(/const isDark = /g, '// const isDark = ')
                  .replace(/const { BG, CHR, SAGE, TERR, MUST } = tokens;/g, 'const { BG, CHR, SAGE, TERR } = tokens;');
});

// 4. app/(tabs)/oracle.tsx
replaceFile('app/(tabs)/oracle.tsx', (content) => {
    return content.replace(/ActivityIndicator, /, '')
                  .replace(/const { BG, CHR, SAGE, TERR, MUST } = tokens;/g, 'const { CHR, SAGE, TERR } = tokens;')
                  .replace(/const { BG, CHR, SAGE, TERR } = tokens;/g, 'const { CHR, SAGE } = tokens;')
                  .replace(/const \[completions, setCompletions\] = useState<any\[\]>\(\[\]\);/g, ''); // Unused
});

// 5. app/(tabs)/profile.tsx
replaceFile('app/(tabs)/profile.tsx', (content) => {
    return content.replace(/useEffect, /, '')
                  .replace(/Animated, /, '')
                  .replace(/const { BG, CHR, SAGE, TERR, MUST } = tokens;/g, 'const { BG, CHR } = tokens;')
                  .replace(/const { data } = await supabase/g, 'const {  } = await supabase') // unused data? actually maybe we want to ignore it
                  .replace(/\},\s*\[\]\);\n\n  const loadProfileData = /g, '}, [loadProfileData]);\n\n  const loadProfileData = ');
});

// 6. app/(tabs)/settings.tsx
replaceFile('app/(tabs)/settings.tsx', (content) => {
    return content.replace(/Linking, /, '')
                  .replace(/const TERRACOTTA = /g, '// const TERRACOTTA = ');
});

// 7. app/_layout.tsx
replaceFile('app/_layout.tsx', (content) => {
    return content.replace(/\},\s*\[initialized\]\);/g, '}, [initialized, router]);');
});

// 8. app/public-profile.tsx
replaceFile('app/public-profile.tsx', (content) => {
    return content.replace(/const { BG, CHR, SAGE, TERR, MUST } = tokens;/g, 'const { CHR, TERR } = tokens;')
                  .replace(/\},\s*\[userId\]\);/g, '}, [userId, loadProfile]);');
});

// 9. app/snap.tsx
replaceFile('app/snap.tsx', (content) => {
    return content.replace(/const { BG, CHR, SAGE, TERR } = tokens;/g, 'const { BG, CHR, SAGE } = tokens;');
});

// 10. app/timer.tsx
replaceFile('app/timer.tsx', (content) => {
    return content.replace(/\},\s*\[phase, isRunning\]\);/g, '}, [phase, isRunning, handlePhaseComplete]);')
                  .replace(/const strokeDash = /g, '// const strokeDash = ');
});

console.log("Done phase 2");
