const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'frontend/src/Pages/Admin/HomePageBuilderPage.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

const replacements = [
    { from: /text-\[\#74AA34\]/g, to: 'text-primary' },
    { from: /bg-\[\#74AA34\]/g, to: 'bg-primary' },
    { from: /border-\[\#74AA34\]/g, to: 'border-primary' },
    { from: /ring-\[\#74AA34\]/g, to: 'ring-primary' },
    { from: /shadow-\[\#74AA34\]/g, to: 'shadow-primary' },
    { from: /hover:text-\[\#74AA34\]/g, to: 'hover:text-primary' },
    { from: /hover:border-\[\#74AA34\]/g, to: 'hover:border-primary' },
    { from: /hover:bg-\[\#74AA34\]/g, to: 'hover:bg-primary' },
    { from: /group-hover:text-\[\#74AA34\]/g, to: 'group-hover:text-primary' },
    { from: /group-hover:bg-\[\#74AA34\]/g, to: 'group-hover:bg-primary' },
    { from: /hover:bg-\[\#629329\]/g, to: 'hover:bg-primary-dark' },
    { from: /bg-\[\#629329\]/g, to: 'bg-primary-dark' },
    { from: /active:bg-\[\#527E23\]/g, to: 'active:bg-primary-dark' },
    { from: /text-\[\#3E6913\]/g, to: 'text-primary-dark' },
    { from: /hover:text-\[\#3E6913\]/g, to: 'hover:text-primary-dark' },
    { from: /bg-\[\#EDF6E5\]/g, to: 'bg-primary-pale' },
    { from: /text-\[\#A6D76E\]/g, to: 'text-accent' },
    { from: /border-\[\#D5EAC3\]/g, to: 'border-primary-light' },
    { from: /bg-\[\#1E5128\]/g, to: 'bg-primary-dark' },
    { from: /text-\[\#1E5128\]/g, to: 'text-primary-dark' },
    { from: /via-\[\#1E5128\]/g, to: 'via-primary-dark' },
    { from: /#74AA34/g, to: '#4d8d3a' }, 
    { from: /#3E6913/g, to: '#1e4d28' },
    { from: /#A6D76E/g, to: '#a6d56c' },
    { from: /#1E5128/g, to: '#1e4d28' },
    { from: /#EDF6E5/g, to: '#ebf7d9' },
    { from: /#629329/g, to: '#1e4d28' },
    { from: /#527E23/g, to: '#1e4d28' }
];

replacements.forEach(repl => {
    content = content.replace(repl.from, repl.to);
});

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully replaced theme classes in HomePageBuilderPage.jsx');
