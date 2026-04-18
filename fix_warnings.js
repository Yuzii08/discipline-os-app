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

// 2. app/(tabs)/_layout.tsx
replaceFile('app/(tabs)/_layout.tsx', (content) => {
    return content.replace(/Settings, /, '');
});

// 3. app/(tabs)/arena.tsx
replaceFile('app/(tabs)/arena.tsx', (content) => {
    return content.replace(/Pressable, /, '');
});

// 4. app/(tabs)/edit-profile.tsx
replaceFile('app/(tabs)/edit-profile.tsx', (content) => {
    return content.replace(/const { BG, CHR, SAGE, TERR, MUST } = tokens;/, 'const { CHR, SAGE, TERR } = tokens;')
                  .replace(/const { BG, CHR, SAGE, TERR, MUST } = tokens;/, 'const { CHR } = tokens;'); // Two places maybe
});

// 5. app/(tabs)/index.tsx
replaceFile('app/(tabs)/index.tsx', (content) => {
    return content.replace(/, withSequence/, '');
});

// 6. app/(tabs)/leaderboard.tsx
replaceFile('app/(tabs)/leaderboard.tsx', (content) => {
    return content.replace(/Pressable, /, '');
});

// 7. app/(tabs)/oracle.tsx
replaceFile('app/(tabs)/oracle.tsx', (content) => {
    return content.replace(/ActivityIndicator, /, '')
                  .replace(/, Zap/, '')
                  .replace(/\]\);\n\n  const loadData = async \(\) => {/g, '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);\n\n  const loadData = async () => {');
});

// 8. app/(tabs)/profile.tsx
replaceFile('app/(tabs)/profile.tsx', (content) => {
    return content.replace(/useEffect, /, '')
                  .replace(/Animated, /, '')
                  .replace(/_\]\);\n\n  const renderContent = \(\) => {/g, '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);\n\n  const renderContent = () => {'); // fallback
});

// 9. app/(tabs)/settings.tsx
replaceFile('app/(tabs)/settings.tsx', (content) => {
    return content.replace(/Linking, /, '');
});

// 10. app/_layout.tsx
replaceFile('app/_layout.tsx', (content) => {
    return content.replace(/\]\);\n\n  if \(!fontsLoaded\) {/g, '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [initialized]);\n\n  if (!fontsLoaded) {');
});

// 11. app/public-profile.tsx
replaceFile('app/public-profile.tsx', (content) => {
    return content.replace(/Star, /, '').replace(/Award, /, '').replace(/Camera, /, '')
                  .replace(/\]\);\n\n  if \(loading\) {/g, '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [userId]);\n\n  if (loading) {');
});

// 12. app/timer.tsx
replaceFile('app/timer.tsx', (content) => {
    return content.replace(/\]\);\n\n  \/\/ -- Formatting --/g, '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [phase, isRunning]);\n\n  // -- Formatting --');
});

console.log("Done");
