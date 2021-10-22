# GitHub Actions: Terraform Detect Changes

GitHub Action for detecting changes to terraform files.

## Usage

This action can be used as follows:

```yaml
      - uses: tchupp/actions-terraform-detect-changes@v1
        included-paths: ""
```

## Background

### [Shut up and show me the copy/paste](#examples)

Some teams choose to have multiple sets of terraform configuration in one git repository.  
Let's say your repo looked like this:

```bash
$ tree
.
├── aws-route53-example-com
│   ├── main.tf
│   └── versions.tf
└── aws-route53-example-io
    ├── main.tf
    └── versions.tf

2 directories, 4 files
```

It would be fairly reasonable to configure a GitHub Actions workflow that ran `terraform apply` for each of your
workspaces:

```yaml
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
    paths:
      - '**.tf'
      - '.github/workflows/terraform.yml'

jobs:
  terraform:
    name: "Terraform"
    runs-on: ubuntu-latest
    strategy:
      matrix:
        path:
          - aws-route53-example-com
          - aws-route53-example-io
        env:
          - development
          - staging
          - production
    env:
      TF_WORKSPACE: "${{ matrix.path }}-${{ matrix.env }}"
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v1
        with:
          terraform_version: ~1.0.0
          cli_config_credentials_token: ${{ secrets.TF_TOKEN }}

      - uses: tchupp/actions-terraform-pr@v1
        with:
          apply-branch: "main"
          path: "${{ matrix.path }}"
```

What happens when you grow to have 10 sets of configuration? What about 50?  
The number of concurrent Terraform runs would grow like crazy, causing you to spend a huge amount on CI time for
configuration sets that didn't even change!

### That's where this action comes into play.

Using this action, you can detect the paths of terraform files that have changed since your last push!  
You can use the output of this action to determine which configuration sets need to run `terraform apply`.

```yaml
on: <omitted for brevity, same as above>

jobs:
  terraform-detect-changes:
    name: "Detect Terraform Changes"
    runs-on: ubuntu-latest
    outputs:
      changed: ${{ steps.detect.outputs.changed }}
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Detect Terraform Changes
        id: detect
        uses: tchupp/actions-terraform-detect-changes@v1

  terraform:
    name: "Terraform"
    needs: terraform-detect-changes
    runs-on: ubuntu-latest
    strategy:
      matrix:
        path: ${{ fromJSON(needs.terraform-detect-changes.outputs.changed) }}
        env:
          - development
          - staging
          - production
    env:
      TF_WORKSPACE: "${{ matrix.path }}-${{ matrix.env }}"
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v1
        with:
          terraform_version: ~1.0.0
          cli_config_credentials_token: ${{ secrets.TF_TOKEN }}

      - uses: tchupp/actions-terraform-pr@v1
        with:
          apply-branch: "main"
          path: "${{ matrix.path }}"
```

Given our original repo layout, let's say a commit gets pushed where only `aws-route53-example-com` is changed.  
When the example workflow runs, this action would output a JSON array containing a list of the changed paths:

```json
[
  "aws-route53-example-com"
]
```

This is then used to build the `matrix` for the job that runs `terraform apply`.  
By using this action, we have saved tons of CI time by skipping `terraform apply` for configuration sets that didn't
change.

## Full Usage

This action can be used as follows:

```yaml
      - uses: tchupp/actions-terraform-detect-changes@v1
        included-paths: ""
```

### Assumptions

The most common cause for issues involves a mismatch in expectations.  
Please read below to make sure your setup aligns with the assumptions made by this action.

#### Setup

This action expects that the repo has been checked out and terraform has been set up with the correct version.  
The following snippet from an example job, [which can be found below](#simple-setup).

```yaml
...
steps:
  - name: Checkout
    uses: actions/checkout@v2
...
```

#### Terraform Layout

This action is only really useful when you have multiple terraform configuration sets in a single repo.  
For instance if your repo only had a single configuration set, this action might be overkill:

```bash
$ tree
.
└── terraform
    ├── main.tf
    └── versions.tf

1 directories, 2 files
```

With a simple repo layout like this, it's sufficient to use `path` filters with GitHub Actions.

### Inputs

#### included-paths

**Optional**. Comma-separated paths to narrow down the search for terraform changes.  
Respects "unix style" path globbing.  
Defaults to all if not specified.

There are a lot of interesting use-cases for this input. Please read below to find out more.

## Examples

### Simple Setup

This is a simplified example based on the setup at the beginning. If your repo has multiple configuration sets and only
contains terraform files as part of configuration sets:

```bash
$ tree
.
├── aws-route53-example-com
│   ├── main.tf
│   └── versions.tf
└── aws-route53-example-io
    ├── main.tf
    └── versions.tf

2 directories, 4 files
```

Then your `.github/workflows/terraform.yml` file could use this:

```yaml
on: <omitted for brevity, same as above>

jobs:
  terraform-detect-changes:
    name: "Detect Terraform Changes"
    runs-on: ubuntu-latest
    outputs:
      changed: ${{ steps.detect.outputs.changed }}
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Detect Terraform Changes
        id: detect
        uses: tchupp/actions-terraform-detect-changes@v1

  terraform:
    name: "Terraform"
    needs: terraform-detect-changes
    runs-on: ubuntu-latest
    strategy:
      matrix:
        path: ${{ fromJSON(needs.terraform-detect-changes.outputs.changed) }}
    env:
      TF_WORKSPACE: "${{ matrix.path }}"
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v1
        with:
          terraform_version: ~1.0.0
          cli_config_credentials_token: ${{ secrets.TF_TOKEN }}

      - uses: tchupp/actions-terraform-pr@v1
        with:
          apply-branch: "main"
          path: "${{ matrix.path }}"
```

## Multiple environments

This is an expanded example based on the setup at the beginning.
If your repo has multiple configuration sets, only contains terraform files as part of configuration sets, 
and is applied to multiple environments:

```bash
$ tree
.
├── aws-route53-example-com
│   ├── main.tf
│   └── versions.tf
└── aws-route53-example-io
    ├── main.tf
    └── versions.tf

2 directories, 4 files
```

Then your `.github/workflows/terraform.yml` file could use this:

```yaml
on: <omitted for brevity, same as above>

jobs:
  terraform-detect-changes:
    name: "Detect Terraform Changes"
    runs-on: ubuntu-latest
    outputs:
      changed: ${{ steps.detect.outputs.changed }}
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Detect Terraform Changes
        id: detect
        uses: tchupp/actions-terraform-detect-changes@v1

  terraform:
    name: "Terraform"
    needs: terraform-detect-changes
    runs-on: ubuntu-latest
    strategy:
      matrix:
        path: ${{ fromJSON(needs.terraform-detect-changes.outputs.changed) }}
        env:
          - development
          - staging
          - production
    env:
      TF_WORKSPACE: "${{ matrix.path }}-${{ matrix.env }}"
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v1
        with:
          terraform_version: ~1.0.0
          cli_config_credentials_token: ${{ secrets.TF_TOKEN }}

      - uses: tchupp/actions-terraform-pr@v1
        with:
          apply-branch: "main"
          path: "${{ matrix.path }}"
```

## Configuration + Examples

Building off the previous example,
if your repo has multiple configuration sets and contains examples you want to exclude:

```bash
$ tree
.
├── examples
│   └── aws-route53
│       ├── main.tf
│       └── versions.tf
├── aws-route53-example-com
│   ├── main.tf
│   └── versions.tf
└── aws-route53-example-io
    ├── main.tf
    └── versions.tf

4 directories, 6 files
```

Then your `.github/workflows/terraform.yml` file could use this config for detecting changes:

```yaml
      - name: Detect Terraform Changes
        id: detect
        uses: tchupp/actions-terraform-detect-changes@v1
        included-paths: "!examples/**"
```

Please note the bang (`!`) and double star glob (`**`)
indicating that every directory below `examples` should be excluded.

However, if we had a structure like follows, `!examples/**`
would **not exclude** `examples` if the files `examples/*.tf` were to change:

```bash
$ tree
.
├── examples
│   ├── main.tf
│   ├── versions.tf
│   └── aws-route53
│       ├── main.tf
│       └── versions.tf
├── aws-route53-example-com
│   ├── main.tf
│   └── versions.tf
└── aws-route53-example-io
    ├── main.tf
    └── versions.tf

5 directories, 8 files
```

If you wanted to exclude the `examples` directory, your configuration would look like:
```yaml
included-paths: "!examples, !examples/**"
```
