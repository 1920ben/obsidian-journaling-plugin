import { App, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface JournalingPluginSettings {
	journalName: string;
	locale: string;
}

const DEFAULT_SETTINGS: JournalingPluginSettings = {
	journalName: 'Journal',
	locale: 'en-US'
}

async function createJournalEntry(app: App, settings: JournalingPluginSettings) {
	const now = new Date();
	const date = now.toLocaleDateString(settings.locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
	const time = now.toLocaleTimeString(settings.locale, { hour: '2-digit', minute: '2-digit' });

	// MODIFICATION: Changed from bold (**) to a Level 2 Heading (##) to make it larger.
	// You can change ## to # for an even larger heading, or ### for a smaller one.
	const entry = `\n## ${date} ${time}\n\n`;

	const fileName = `${settings.journalName}.md`;

	let file = app.vault.getAbstractFileByPath(fileName);
	if (!file) {
		file = await app.vault.create(fileName, "");
	}

	if (file instanceof TFile) {
		await app.vault.append(file, entry);
		const leaf = app.workspace.getLeaf(true);
		await leaf.openFile(file);

		// Move cursor to the end of the file
		const editor = app.workspace.activeEditor?.editor;
		if (editor) {
			const length = editor.lastLine();
			editor.setCursor({ line: length + 1, ch: 0 });
		}
	}
}

export default class JournalingPlugin extends Plugin {
	settings: JournalingPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('calendar-plus', 'Create journal entry', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			createJournalEntry(this.app, this.settings);
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'create-journal-entry',
			name: 'Create journal entry',
			callback: () => {
				createJournalEntry(this.app, this.settings);
			}
		});


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new JournalingSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class JournalingSettingTab extends PluginSettingTab {
	plugin: JournalingPlugin;

	constructor(app: App, plugin: JournalingPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Journal name')
			.setDesc('The name of the journal file (without .md)')
			.addText(text => text
				.setPlaceholder('Enter your journal name')
				.setValue(this.plugin.settings.journalName)
				.onChange(async (value) => {
					this.plugin.settings.journalName = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Locale')
			.setDesc('The locale to use for date and time formatting (e.g. en-US, en-GB, de-DE)')
			.addText(text => text
				.setPlaceholder('Enter your locale')
				.setValue(this.plugin.settings.locale)
				.onChange(async (value) => {
					this.plugin.settings.locale = value;
					await this.plugin.saveSettings();
				}));
	}
