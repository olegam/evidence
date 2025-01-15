<script>
	import '@evidence-dev/tailwind/fonts.css';
	import '../app.css';
	import { EvidenceDefaultLayout } from '@evidence-dev/core-components';
	export let data;
	import { page } from '$app/stores';

	const isDummy = $page.url.searchParams.get('dummy') === 'true';
	console.log(
		`🚠[${$page.url.searchParams.get('tag') ?? 'untagged'}] ${isDummy ? "[🤡]" : ""} +layout.svelte [${performance.now().toFixed(0)}]`
	);
</script>

<EvidenceDefaultLayout {data}>
	<slot slot="content" />
</EvidenceDefaultLayout>
