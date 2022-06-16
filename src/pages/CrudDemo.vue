<template>
	<div class="grid">
		<div class="col-12">
			<div class="card">
				<Toast />
				<Toolbar class="mb-4">
					<template v-slot:start>
						<div class="my-2">
							<Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="openNew" />
						</div>
					</template>
				</Toolbar>

				<DataTable ref="dt" :value="products" v-model:selection="selectedProducts" dataKey="id"
					:paginator="true" :rows="10" :filters="filters"
					paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
					:rowsPerPageOptions="[5, 10, 25]"
					currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
					responsiveLayout="scroll">
					<template #header>
						<div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
							<h5 class="m-0">Manage Products</h5>
							<span class="block mt-2 md:mt-0 p-input-icon-left">
								<i class="pi pi-search" />
								<InputText v-model="filters['global'].value" placeholder="Search..." />
							</span>
						</div>
					</template>

					<Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
					<Column field="code" header="Code" :sortable="true" headerStyle="width:14%; min-width:10rem;">
						<template #body="slotProps">
							<span class="p-column-title">Code</span>
							{{ slotProps.data.code }}
						</template>
					</Column>
					<Column field="name" header="Name" :sortable="true" headerStyle="width:14%; min-width:10rem;">
						<template #body="slotProps">
							<span class="p-column-title">Name</span>
							{{ slotProps.data.name }}
						</template>
					</Column>
					<Column header="Image" headerStyle="width:14%; min-width:10rem;">
						<template #body="slotProps">
							<span class="p-column-title">Image</span>
							<img :src="'images/product/' + slotProps.data.image" :alt="slotProps.data.image"
								class="shadow-2" width="100" />
						</template>
					</Column>
					<Column field="price" header="Price" :sortable="true" headerStyle="width:14%; min-width:8rem;">
						<template #body="slotProps">
							<span class="p-column-title">Price</span>
							{{ formatCurrency(slotProps.data.price) }}
						</template>
					</Column>
					<Column field="category" header="Category" :sortable="true"
						headerStyle="width:14%; min-width:10rem;">
						<template #body="slotProps">
							<span class="p-column-title">Category</span>
							{{ formatCurrency(slotProps.data.category) }}
						</template>
					</Column>
					<Column field="rating" header="Reviews" :sortable="true" headerStyle="width:14%; min-width:10rem;">
						<template #body="slotProps">
							<span class="p-column-title">Rating</span>
							<Rating :modelValue="slotProps.data.rating" :readonly="true" :cancel="false" />
						</template>
					</Column>
					<Column field="inventoryStatus" header="Status" :sortable="true"
						headerStyle="width:14%; min-width:10rem;">
						<template #body="slotProps">
							<span class="p-column-title">Status</span>
							<span
								:class="'product-badge status-' + (slotProps.data.inventoryStatus ? slotProps.data.inventoryStatus.toLowerCase() : '')">{{
										slotProps.data.inventoryStatus
								}}</span>
						</template>
					</Column>
					<Column headerStyle="min-width:10rem;">
						<template #body="slotProps">
							<Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2"
								@click="editProduct(slotProps.data)" />
							<Button icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2"
								@click="confirmDeleteProduct(slotProps.data)" />
						</template>
					</Column>
				</DataTable>

				<Dialog v-model:visible="productDialog" :style="{ width: '450px' }" header="Product Details"
					:modal="true" class="p-fluid">
					<div class="field">
						<label for="inventoryStatus" class="mb-3">Access Type</label>
						<Dropdown id="inventoryStatus" v-model="product.accessType" :options="statuses"
							optionLabel="label" placeholder="Select a Status">
						</Dropdown>
					</div>

					<div class="field">
						<label class="mb-3">File</label>
						<div class="formgrid grid">
							<FileUpload mode="basic" :maxFileSize="1000000" label="Upload" chooseLabel="Upload"
								class="ml-2 inline-block" :customUpload="true" @select="myUploader"
								@uploader="cancelUpload" />

						</div>
					</div>

					<template #footer>
						<Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
						<Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveProduct" />
					</template>
				</Dialog>

				<Dialog v-model:visible="deleteProductDialog" :style="{ width: '450px' }" header="Confirm"
					:modal="true">
					<div class="flex align-items-center justify-content-center">
						<i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
						<span v-if="product">Are you sure you want to delete <b>{{ product.name }}</b>?</span>
					</div>
					<template #footer>
						<Button label="No" icon="pi pi-times" class="p-button-text"
							@click="deleteProductDialog = false" />
						<Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteProduct" />
					</template>
				</Dialog>
			</div>
		</div>
	</div>

</template>

<script>
import { FilterMatchMode } from 'primevue/api';
import asm from 'asmcrypto-lite'
import axios from 'axios'
import ProductService from '../service/ProductService';

export default {
	data() {
		return {
			products: null,
			productDialog: false,
			deleteProductDialog: false,
			deleteProductsDialog: false,
			product: {},
			selectedProducts: null,
			filters: {},
			submitted: false,
			statuses: [
				{ label: 'Private', value: 'PRIVATE' },
				{ label: 'Public', value: 'PUBLIC' },
			]
		}
	},
	productService: null,
	created() {
		this.productService = new ProductService();
		this.initFilters();
	},
	mounted() {
		this.productService.getProducts().then(data => this.products = data);
	},
	methods: {
		formatCurrency(value) {
			if (value)
				return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
			return;
		},
		async myUploader(event) {
			this.product.file = event.files[0];
			this.product.fileHash = asm.SHA256.hex(await event.files[0].arrayBuffer());
		},
		cancelUpload() {
			this.product = {};
		},
		openNew() {
			this.product = {};
			this.submitted = false;
			this.productDialog = true;
		},
		hideDialog() {
			this.productDialog = false;
			this.submitted = false;
		},
		async saveProduct() {
			console.log(this.product)
			if (!this.product.file || !this.product.fileHash || !this.product.accessType) {
				this.$toast.add({ severity: 'error', summary: 'Warning', detail: 'Please complete the form', life: 3000 });
				return;
			}

			const formData = new FormData();

			formData.append("file", this.product.file);
			formData.append('properties', new Blob([JSON.stringify({
				"accessType": this.product.accessType.value,
				"hashValue": this.product.fileHash
			})], {
				type: "application/json"
			}), null);
			let response;
			try {
				response = await axios.post("http://localhost:8081/v1/api/files", formData, {
					headers: {
						X_TENANT_ID: '6dee40bc-7943-43ca-a5a3-f008c063ab05',
						'Content-Type': undefined
					}
				});
			} catch (e) {
				console.log(e);
				this.$toast.add({ severity: 'error', summary: 'Warning', detail: 'An error occured', life: 3000 });
			}
			const resp = response.data;
			if (resp.responseHeader.success === true) {
				this.$toast.add({ severity: 'success', summary: 'Success', detail: '', life: 3000 });

			} else {
				this.$toast.add({ severity: 'error', summary: 'Error', detail: resp.responseHeader.message.text, life: 3000 });
			}
			this.productDialog = false;

		},

		editProduct(product) {
			this.product = { ...product };
			this.productDialog = true;
		},
		confirmDeleteProduct(product) {
			this.product = product;
			this.deleteProductDialog = true;
		},
		deleteProduct() {
			this.products = this.products.filter(val => val.id !== this.product.id);
			this.deleteProductDialog = false;
			this.product = {};
			this.$toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Deleted', life: 3000 });
		},
		findIndexById(id) {
			let index = -1;
			for (let i = 0; i < this.products.length; i++) {
				if (this.products[i].id === id) {
					index = i;
					break;
				}
			}
			return index;
		},
		createId() {
			let id = '';
			var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
			for (var i = 0; i < 5; i++) {
				id += chars.charAt(Math.floor(Math.random() * chars.length));
			}
			return id;
		},
		exportCSV() {
			this.$refs.dt.exportCSV();
		},
		confirmDeleteSelected() {
			this.deleteProductsDialog = true;
		},
		deleteSelectedProducts() {
			this.products = this.products.filter(val => !this.selectedProducts.includes(val));
			this.deleteProductsDialog = false;
			this.selectedProducts = null;
			this.$toast.add({ severity: 'success', summary: 'Successful', detail: 'Products Deleted', life: 3000 });
		},
		initFilters() {
			this.filters = {
				'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
			}
		}
	}
}
</script>

<style scoped lang="scss">
@import '../assets/demo/badges.scss';
</style>
